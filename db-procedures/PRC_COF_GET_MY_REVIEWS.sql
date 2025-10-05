-- =============================================
-- 내 리뷰 목록 조회 프로시저 (수정)
-- 화면: [13-01]내리뷰_리뷰내역
-- =============================================
CREATE   PROCEDURE [dbo].[PRC_COF_GET_MY_REVIEWS]
    @p_user_id INT,
    @p_photo_only BIT = 0,
    @p_sort_type VARCHAR(20) = 'LATEST',
    @p_page_size INT = 20,
    @p_page_number INT = 1,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_offset INT = (@p_page_number - 1) * @p_page_size;
    
    BEGIN TRY
        -- 내 리뷰 목록 조회
        SELECT 
            r.review_id,
            r.coffee_blend_id,
            c.coffee_name,
            r.star_rating,
            r.review_content,
            r.like_count,
            r.view_count,
            r.has_photo,
            r.point_status,
            r.point_amount,
            r.point_approved_at,
            r.created_at,
            -- 첫 번째 이미지
            (SELECT TOP 1 image_url 
             FROM TB_COF_REVI_PHOT 
             WHERE review_id = r.review_id 
             ORDER BY image_order) AS first_image_url,
            -- 전체 이미지 수
            (SELECT COUNT(*) 
             FROM TB_COF_REVI_PHOT 
             WHERE review_id = r.review_id) AS photo_count
        FROM TB_COF_REVI_MAIN r
        INNER JOIN TB_COF_COFF_BLND c ON r.coffee_blend_id = c.coffee_blend_id
        WHERE r.user_id = @p_user_id
            AND r.deleted_at IS NULL
            AND (@p_photo_only = 0 OR r.has_photo = 1)
        ORDER BY 
            CASE 
                WHEN @p_sort_type = 'LATEST' THEN r.created_at
            END DESC,
            CASE 
                WHEN @p_sort_type = 'POPULAR' THEN r.like_count
            END DESC,
            r.created_at DESC
        OFFSET @v_offset ROWS
        FETCH NEXT @p_page_size ROWS ONLY;
        
        -- 전체 개수 조회
        SELECT COUNT(*) AS total_count
        FROM TB_COF_REVI_MAIN r
        WHERE r.user_id = @p_user_id
            AND r.deleted_at IS NULL
            AND (@p_photo_only = 0 OR r.has_photo = 1);
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'내 리뷰 목록 조회 완료';
        
    END TRY
    BEGIN CATCH
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

