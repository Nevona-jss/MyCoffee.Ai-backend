-- =============================================
-- 리뷰 상세 조회 프로시저
-- 화면: [06-03]리뷰_커피리뷰분석보기
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_GET_REVIEW_DETAIL]
    @p_review_id INT,
    @p_current_user_id INT = NULL,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 리뷰 조회수 증가
        UPDATE TB_COF_REVI_MAIN
        SET view_count = view_count + 1,
            updated_at = GETDATE()
        WHERE review_id = @p_review_id;
        
        -- 리뷰 기본 정보
        SELECT 
            r.review_id,
            r.user_id,
            u.name AS user_name,
            r.coffee_blend_id,
            c.coffee_name,
            c.summary AS coffee_summary,
            r.star_rating,
            r.review_content,
            r.like_count,
            r.view_count,
            r.has_photo,
            r.point_status,
            r.point_amount,
            r.created_at,
            r.updated_at,
            -- 현재 사용자의 좋아요 여부
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM TB_COF_REVI_LIKE 
                    WHERE review_id = r.review_id 
                        AND user_id = @p_current_user_id
                ) THEN 1
                ELSE 0
            END AS is_liked
        FROM TB_COF_REVI_MAIN r
        INNER JOIN TB_COF_USER_ACCT u ON r.user_id = u.user_id
        INNER JOIN TB_COF_COFF_BLND c ON r.coffee_blend_id = c.coffee_blend_id
        WHERE r.review_id = @p_review_id
            AND r.deleted_at IS NULL
            AND r.is_visible = 1;
        
        -- 리뷰 이미지 목록
        SELECT 
            photo_id,
            review_id,
            image_url,
            image_order,
            file_size,
            mime_type
        FROM TB_COF_REVI_PHOT
        WHERE review_id = @p_review_id
        ORDER BY image_order;
        
        -- 커피 프로파일 정보
        SELECT 
            cp.coffee_blend_id,
            cp.taste_attribute_id,
            mt.attribute_name,
            mt.attribute_code,
            cp.intensity_score
        FROM TB_COF_COFF_PROF cp
        INNER JOIN TB_COF_MSTR_TAST mt ON cp.taste_attribute_id = mt.taste_attribute_id
        WHERE cp.coffee_blend_id = (
            SELECT coffee_blend_id FROM TB_COF_REVI_MAIN WHERE review_id = @p_review_id
        )
        ORDER BY cp.taste_attribute_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'리뷰 상세 조회 완료';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

