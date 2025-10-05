-- =============================================
-- 리뷰 목록 조회 프로시저
-- 화면: [06-01]리뷰_메인홈
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_GET_REVIEW_LIST]
    @p_photo_only BIT = 0,              -- 포토리뷰만 보기 (0: 전체, 1: 포토만)
    @p_sort_type VARCHAR(20) = 'LATEST', -- 정렬 (LATEST: 최신순, POPULAR: 인기순, RATING_HIGH: 별점높은순, RATING_LOW: 별점낮은순)
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
        -- 리뷰 목록 조회
        SELECT 
            r.review_id,
            r.user_id,
            u.name AS user_name,
            r.coffee_blend_id,
            c.coffee_name,
            r.star_rating,
            r.review_content,
            r.like_count,
            r.view_count,
            r.has_photo,
            r.point_status,
            r.point_amount,
            r.created_at,
            -- 첫 번째 이미지
            (SELECT TOP 1 image_url 
             FROM TB_COF_REVI_PHOT 
             WHERE review_id = r.review_id 
             ORDER BY image_order) AS first_image_url,
            -- 전체 이미지 수
            (SELECT COUNT(*) 
             FROM TB_COF_REVI_PHOT 
             WHERE review_id = r.review_id) AS photo_count,
            -- 현재 사용자의 좋아요 여부 (별도 파라미터로 user_id 전달 시)
            0 AS is_liked
        FROM TB_COF_REVI_MAIN r
        INNER JOIN TB_COF_USER_ACCT u ON r.user_id = u.user_id
        INNER JOIN TB_COF_COFF_BLND c ON r.coffee_blend_id = c.coffee_blend_id
        WHERE r.deleted_at IS NULL 
            AND r.is_visible = 1
            AND (@p_photo_only = 0 OR r.has_photo = 1)
        ORDER BY 
            CASE 
                WHEN @p_sort_type = 'LATEST' THEN r.created_at
            END DESC,
            CASE 
                WHEN @p_sort_type = 'POPULAR' THEN r.like_count
            END DESC,
            CASE 
                WHEN @p_sort_type = 'RATING_HIGH' THEN r.star_rating
            END DESC,
            CASE 
                WHEN @p_sort_type = 'RATING_LOW' THEN r.star_rating
            END ASC,
            r.created_at DESC
        OFFSET @v_offset ROWS
        FETCH NEXT @p_page_size ROWS ONLY;
        
        -- 전체 개수 조회
        SELECT COUNT(*) AS total_count
        FROM TB_COF_REVI_MAIN r
        WHERE r.deleted_at IS NULL 
            AND r.is_visible = 1
            AND (@p_photo_only = 0 OR r.has_photo = 1);
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'리뷰 목록 조회 완료';
        
    END TRY
    BEGIN CATCH
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

