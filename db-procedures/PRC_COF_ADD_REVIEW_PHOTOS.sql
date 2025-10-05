-- =============================================
-- 리뷰 이미지 등록 프로시저
-- 화면: [13-04]리뷰_작성하기
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_ADD_REVIEW_PHOTOS]
    @p_review_id INT,
    @p_user_id INT,
    @p_image_url NVARCHAR(500),
    @p_image_order INT,
    @p_file_size BIGINT = NULL,
    @p_mime_type VARCHAR(50) = NULL,
    
    -- 출력 매개변수
    @p_photo_id INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_owner_id INT;
    DECLARE @v_photo_count INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_photo_id = NULL;
        
        -- 리뷰 소유자 확인
        SELECT @v_owner_id = user_id
        FROM TB_COF_REVI_MAIN
        WHERE review_id = @p_review_id
            AND deleted_at IS NULL;
        
        IF @v_owner_id IS NULL
        BEGIN
            SET @p_result_code = 'REVIEW_NOT_FOUND';
            SET @p_result_message = N'리뷰를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @v_owner_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 이미지 개수 확인 (최대 3개)
        SELECT @v_photo_count = COUNT(*)
        FROM TB_COF_REVI_PHOT
        WHERE review_id = @p_review_id;
        
        IF @v_photo_count >= 3
        BEGIN
            SET @p_result_code = 'MAX_PHOTOS_EXCEEDED';
            SET @p_result_message = N'이미지는 최대 3개까지 등록 가능합니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 이미지 순서 검증
        IF @p_image_order < 1 OR @p_image_order > 3
        BEGIN
            SET @p_result_code = 'INVALID_ORDER';
            SET @p_result_message = N'이미지 순서는 1~3 사이여야 합니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 중복 순서 확인
        IF EXISTS (
            SELECT 1 FROM TB_COF_REVI_PHOT
            WHERE review_id = @p_review_id
                AND image_order = @p_image_order
        )
        BEGIN
            SET @p_result_code = 'DUPLICATE_ORDER';
            SET @p_result_message = N'이미 해당 순서의 이미지가 존재합니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 이미지 등록
        INSERT INTO TB_COF_REVI_PHOT (
            review_id, image_url, image_order, file_size, mime_type, created_at
        ) VALUES (
            @p_review_id, @p_image_url, @p_image_order, @p_file_size, @p_mime_type, GETDATE()
        );
        
        SET @p_photo_id = SCOPE_IDENTITY();
        
        -- 리뷰의 has_photo 플래그 업데이트
        UPDATE TB_COF_REVI_MAIN
        SET has_photo = 1,
            updated_at = GETDATE()
        WHERE review_id = @p_review_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'이미지가 등록되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_photo_id = NULL;
    END CATCH
END;
go

