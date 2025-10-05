
-- =============================================
-- 9. 구독 일시정지 프로시저
-- 화면: [16-01]구독관리_메인
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_PAUSE_SUBSCRIPTION]
    @p_subscription_id INT,
    @p_user_id INT,
    
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
            SET @p_result_message = N'구독 관리 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 일시정지 가능 상태 확인
        IF @v_subscription_status != 'ACTIVE'
        BEGIN
            SET @p_result_code = 'CANNOT_PAUSE';
            SET @p_result_message = N'활성 상태의 구독만 일시정지할 수 있습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 구독 일시정지 처리
        UPDATE TB_COF_SUBS_MAIN
        SET subscription_status = 'PAUSED',
            paused_at = GETDATE(),
            updated_at = GETDATE()
        WHERE subscription_id = @p_subscription_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'구독이 일시정지되었습니다.';
        
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

