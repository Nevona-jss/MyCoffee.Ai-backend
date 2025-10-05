-- =============================================
-- 리뷰 좋아요/취소 프로시저
-- 화면: [06-01]리뷰_메인홈
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_TOGGLE_REVIEW_LIKE]
    @p_review_id INT,
    @p_user_id INT,
    
    -- 출력 매개변수
    @p_is_liked BIT OUTPUT,
    @p_like_count INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_existing_like_id INT = NULL;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_is_liked = 0;
        SET @p_like_count = 0;
        
        -- 리뷰 존재 확인
        IF NOT EXISTS (
            SELECT 1 FROM TB_COF_REVI_MAIN 
            WHERE review_id = @p_review_id 
                AND deleted_at IS NULL
                AND is_visible = 1
        )
        BEGIN
            SET @p_result_code = 'REVIEW_NOT_FOUND';
            SET @p_result_message = N'리뷰를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 기존 좋아요 확인
        SELECT @v_existing_like_id = like_id
        FROM TB_COF_REVI_LIKE
        WHERE review_id = @p_review_id
            AND user_id = @p_user_id;
        
        IF @v_existing_like_id IS NULL
        BEGIN
            -- 좋아요 추가
            INSERT INTO TB_COF_REVI_LIKE (
                review_id, user_id, created_at
            ) VALUES (
                @p_review_id, @p_user_id, GETDATE()
            );
            
            -- 리뷰 좋아요 카운트 증가
            UPDATE TB_COF_REVI_MAIN
            SET like_count = like_count + 1,
                updated_at = GETDATE()
            WHERE review_id = @p_review_id;
            
            SET @p_is_liked = 1;
        END
        ELSE
        BEGIN
            -- 좋아요 취소
            DELETE FROM TB_COF_REVI_LIKE
            WHERE like_id = @v_existing_like_id;
            
            -- 리뷰 좋아요 카운트 감소
            UPDATE TB_COF_REVI_MAIN
            SET like_count = like_count - 1,
                updated_at = GETDATE()
            WHERE review_id = @p_review_id;
            
            SET @p_is_liked = 0;
        END
        
        -- 최종 좋아요 카운트 조회
        SELECT @p_like_count = like_count
        FROM TB_COF_REVI_MAIN
        WHERE review_id = @p_review_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'처리되었습니다.';
        
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

