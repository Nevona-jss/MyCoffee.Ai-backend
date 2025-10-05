-- =============================================
-- 리뷰 수정 프로시저
-- 화면: [06-02]리뷰_옵션 > 수정
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_UPDATE_REVIEW]
    @p_review_id INT,
    @p_user_id INT,
    @p_star_rating INT,
    @p_review_content NVARCHAR(300),
    @p_image_urls NVARCHAR(MAX) = NULL,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_owner_id INT;
    DECLARE @v_has_photo BIT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 소유자 확인
        SELECT @v_owner_id = user_id
        FROM TB_COF_REVI_MAIN
        WHERE review_id = @p_review_id
            AND deleted_at IS NULL;
        
        IF @v_owner_id IS NULL
        BEGIN
            SET @p_result_code = 'NOT_FOUND';
            SET @p_result_message = N'리뷰를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @v_owner_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'수정 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 입력값 검증
        IF @p_star_rating < 1 OR @p_star_rating > 5
        BEGIN
            SET @p_result_code = 'INVALID_RATING';
            SET @p_result_message = N'별점은 1~5점 사이로 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF LEN(LTRIM(RTRIM(@p_review_content))) < 1 OR LEN(LTRIM(RTRIM(@p_review_content))) > 300
        BEGIN
            SET @p_result_code = 'INVALID_CONTENT';
            SET @p_result_message = N'리뷰 내용은 1~300자 사이로 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 포토 여부 확인
        IF @p_image_urls IS NOT NULL AND LEN(@p_image_urls) > 2
            SET @v_has_photo = 1;
        
        -- 리뷰 수정
        UPDATE TB_COF_REVI_MAIN
        SET star_rating = @p_star_rating,
            review_content = LTRIM(RTRIM(@p_review_content)),
            has_photo = @v_has_photo,
            updated_at = GETDATE()
        WHERE review_id = @p_review_id;
        
        -- 기존 이미지 삭제 후 재등록 (실제 구현 시 상세 로직 필요)
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'리뷰가 수정되었습니다.';
        
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

