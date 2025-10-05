
-- =============================================
-- 4. 내 커피 컬렉션 수정 프로시저 (신규)
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_UPDATE_COLLECTION]
    @p_collection_id INT,
    @p_user_id INT,
    @p_collection_name NVARCHAR(50),
    @p_personal_comment NVARCHAR(100),
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_owner_id INT;
    DECLARE @v_duplicate_count INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 소유자 확인
        SELECT @v_owner_id = user_id
        FROM TB_COF_MY_COLL
        WHERE collection_id = @p_collection_id
            AND deleted_at IS NULL;
        
        IF @v_owner_id IS NULL
        BEGIN
            SET @p_result_code = 'NOT_FOUND';
            SET @p_result_message = N'컬렉션을 찾을 수 없습니다.';
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
        
        -- 이름 중복 체크 (자기 자신 제외)
        SELECT @v_duplicate_count = COUNT(*)
        FROM TB_COF_MY_COLL
        WHERE user_id = @p_user_id 
            AND collection_name = @p_collection_name
            AND collection_id != @p_collection_id
            AND deleted_at IS NULL;
        
        IF @v_duplicate_count > 0
        BEGIN
            SET @p_result_code = 'DUPLICATE_NAME';
            SET @p_result_message = N'이미 사용중인 이름입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 수정
        UPDATE TB_COF_MY_COLL
        SET collection_name = @p_collection_name,
            personal_comment = @p_personal_comment,
            updated_at = GETDATE()
        WHERE collection_id = @p_collection_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'수정되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

