
-- =============================================
-- 11. 구독 취소 프로시저  
-- 화면: [16-02]구독관리_옵션
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_CANCEL_SUBSCRIPTION]
    @p_subscription_id INT,
    @p_user_id INT,
    @p_cancel_reason NVARCHAR(200) = N'사용자 요청',
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_subscription_user_id INT;
    DECLARE @v_subscription_status VARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 구독 정보 확인
        SELECT 
            @v_subscription_user_id = user_id,
            @v_subscription_status = subscription_status
        FROM TB_COF_SUBS_MAIN 
        WHERE subscription_id = @p_subscription_id;
        
        -- 구독 존재 및 권한 확인
        IF @v_subscription_user_id IS NULL
        BEGIN
            SET @p_result_code = 'SUBSCRIPTION_NOT_FOUND';
            SET @p_result_message = N'구독 정보를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @v_subscription_user_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'구독 취소 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 취소 가능 상태 확인
        IF @v_subscription_status NOT IN ('ACTIVE', 'PAUSED')
        BEGIN
            SET @p_result_code = 'CANNOT_CANCEL';
            SET @p_result_message = N'취소할 수 없는 구독 상태입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 구독 취소 처리
        UPDATE TB_COF_SUBS_MAIN
        SET subscription_status = 'CANCELLED',
            cancelled_at = GETDATE(),
            updated_at = GETDATE()
        WHERE subscription_id = @p_subscription_id;
        
        -- 취소 로그 기록
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, user_id, ip_address, 
            login_method, success, failure_reason, attempted_at
        ) VALUES (
            'SUBSCRIPTION_CANCEL', 'SUB_' + CAST(@p_subscription_id AS VARCHAR), @p_user_id, 'SERVER',
            'SYSTEM', 1, N'구독취소: ' + @p_cancel_reason, GETDATE()
        );
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'구독이 취소되었습니다.';
        
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

