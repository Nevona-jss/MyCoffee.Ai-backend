
-- =============================================
-- 8. 구독 다음 주기 주문 생성 프로시저 (배치용)
-- 정기구독의 자동 주문 생성을 위한 프로시저
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_CREATE_NEXT_SUBSCRIPTION_ORDER]
    @p_subscription_id INT,
    
    -- 출력 매개변수
    @p_order_id INT OUTPUT,
    @p_order_number VARCHAR(20) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_user_id INT;
    DECLARE @v_collection_id INT;
    DECLARE @v_current_cycle INT;
    DECLARE @v_total_cycles INT;
    DECLARE @v_cycle_amount INT;
    DECLARE @v_next_payment_date DATE;
    DECLARE @v_next_delivery_date DATE;
    DECLARE @v_billing_key_id INT;
    DECLARE @v_order_number VARCHAR(20);
    DECLARE @v_subscription_status VARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 구독 정보 조회
        SELECT 
            @v_user_id = user_id,
            @v_collection_id = collection_id,
            @v_current_cycle = current_cycle,
            @v_total_cycles = total_cycles,
            @v_cycle_amount = cycle_amount,
            @v_next_payment_date = next_payment_date,
            @v_next_delivery_date = next_delivery_date,
            @v_billing_key_id = billing_key_id,
            @v_subscription_status = subscription_status
        FROM TB_COF_SUBS_MAIN 
        WHERE subscription_id = @p_subscription_id;
        
        -- 구독 정보 존재 확인
        IF @v_user_id IS NULL
        BEGIN
            SET @p_result_code = 'SUBSCRIPTION_NOT_FOUND';
            SET @p_result_message = N'구독 정보를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 구독 상태 확인
        IF @v_subscription_status != 'ACTIVE'
        BEGIN
            SET @p_result_code = 'SUBSCRIPTION_NOT_ACTIVE';
            SET @p_result_message = N'활성 상태의 구독이 아닙니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 결제 예정일 확인
        IF @v_next_payment_date > GETDATE()
        BEGIN
            SET @p_result_code = 'NOT_PAYMENT_TIME';
            SET @p_result_message = N'아직 결제 예정일이 아닙니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 구독 완료 여부 확인
        IF @v_current_cycle >= @v_total_cycles
        BEGIN
            -- 구독 완료 처리
            UPDATE TB_COF_SUBS_MAIN
            SET subscription_status = 'COMPLETED',
                updated_at = GETDATE()
            WHERE subscription_id = @p_subscription_id;
            
            SET @p_result_code = 'SUBSCRIPTION_COMPLETED';
            SET @p_result_message = N'구독이 완료되었습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 다음 주기 증가
        SET @v_current_cycle = @v_current_cycle + 1;
        
        -- 주문번호 생성
        SET @v_order_number = 'SUB' + FORMAT(GETDATE(), 'yyyyMMdd') + RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR), 6);
        
        -- 새 주문 생성
        INSERT INTO TB_COF_ORDR_MAIN (
            order_number, user_id, collection_id, order_type, order_status,
            total_amount, shipping_fee, point_discount, final_amount, 
            payment_method, payment_status, order_date, created_at, updated_at
        ) VALUES (
            @v_order_number, @v_user_id, @v_collection_id, 'SUBSCRIPTION', 'ORDER_RECEIVED',
            @v_cycle_amount, 0, 0, @v_cycle_amount,
            'AUTO_BILLING', 'READY', GETDATE(), GETDATE(), GETDATE()
        );
        
        SET @p_order_id = SCOPE_IDENTITY();
        
        -- 구독 주문 연결 정보 저장
        INSERT INTO TB_COF_SUBS_ORDR (
            subscription_id, order_id, cycle_number, payment_date, 
            delivery_date, order_status, created_at, updated_at
        ) VALUES (
            @p_subscription_id, @p_order_id, @v_current_cycle, @v_next_payment_date,
            @v_next_delivery_date, 'ORDER_RECEIVED', GETDATE(), GETDATE()
        );
        
        -- 구독 정보 업데이트 (다음 결제/배송일 계산)
        UPDATE TB_COF_SUBS_MAIN
        SET current_cycle = @v_current_cycle,
            next_payment_date = CASE 
                WHEN @v_current_cycle < @v_total_cycles 
                THEN DATEADD(MONTH, 1, @v_next_payment_date)
                ELSE NULL 
            END,
            next_delivery_date = CASE 
                WHEN @v_current_cycle < @v_total_cycles 
                THEN DATEADD(MONTH, 1, @v_next_delivery_date)
                ELSE NULL 
            END,
            updated_at = GETDATE()
        WHERE subscription_id = @p_subscription_id;
        
        SET @p_order_number = @v_order_number;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'다음 주기 주문이 생성되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_order_id = NULL;
        SET @p_order_number = NULL;
    END CATCH
END;
go

