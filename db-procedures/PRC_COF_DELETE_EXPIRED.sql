CREATE PROCEDURE [dbo].[PRC_COF_DELETE_EXPIRED]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @deleted_count INT = 0;
    DECLARE @error_message NVARCHAR(255);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 만료된 분석 데이터 삭제 (저장되지 않은 것만)
        DELETE FROM TB_COF_TAST_ANLY  
        WHERE expires_at IS NOT NULL 
            AND expires_at < GETDATE()
            AND is_saved = 0;
            
        SET @deleted_count = @@ROWCOUNT;
        
        -- 삭제 로그 기록 (필요시)
        IF @deleted_count > 0
        BEGIN
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, 
                login_method, success, failure_reason, attempted_at
            ) VALUES (
                'SYSTEM', 'AUTO_CLEANUP', 'SERVER', 
                'SYSTEM', 1, 'Deleted ' + CAST(@deleted_count AS VARCHAR(10)) + ' expired analysis records', 
                GETDATE()
            );
        END
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @error_message = 'Error in expired data cleanup: ' + ERROR_MESSAGE();
        
        -- 에러 로그 기록
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, ip_address, 
            login_method, success, failure_reason, attempted_at
        ) VALUES (
            'SYSTEM', 'AUTO_CLEANUP_ERROR', 'SERVER', 
            'SYSTEM', 0, @error_message, GETDATE()
        );
    END CATCH
END;
go

