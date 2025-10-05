
-- =============================================
-- 5. 내 커피 컬렉션 삭제 프로시저 (신규)
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_DELETE_COLLECTION]
    @p_collection_id INT,
    @p_user_id INT,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_owner_id INT;
    
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
            SET @p_result_message = N'삭제 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 소프트 삭제
        UPDATE TB_COF_MY_COLL
        SET deleted_at = GETDATE(),
            updated_at = GETDATE()
        WHERE collection_id = @p_collection_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'삭제되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

