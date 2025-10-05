
-- =============================================
-- 3. 주문 취소 프로시저
-- 화면: [12-02]주문취소
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_CANCEL_ORDER]
    @p_order_id INT,
    @p_user_id INT,
    @p_cancel_reason NVARCHAR(200) = N'사용자 요청',
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_order_status VARCHAR(20);
    DECLARE @v_order_user_id INT;
    DECLARE @v_point_discount INT = 0;
    DECLARE @v_payment_status VARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 주문 정보 확인
        SELECT 
            @v_order_status = order_status,
            @v_order_user_id = user_id,
            @v_point_discount = point_discount,
            @v_payment_status = payment_status
        FROM TB_COF_ORDR_MAIN 
        WHERE order_id = @p_order_id AND deleted_at IS NULL;
        
        -- 주문 존재 확인
        IF @v_order_user_id IS NULL
        BEGIN
            SET @p_result_code = 'ORDER_NOT_FOUND';
            SET @p_result_message = N'주문 정보를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 주문자 확인
        IF @v_order_user_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'취소 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 취소 가능 상태 확인
        IF @v_order_status NOT IN ('ORDER_RECEIVED', 'PREPARING')
        BEGIN
            SET @p_result_code = 'CANNOT_CANCEL';
            SET @p_result_message = N'현재 주문 상태에서는 취소할 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 주문 상태 업데이트
        UPDATE TB_COF_ORDR_MAIN
        SET order_status = 'CANCELLED',
            payment_status = 'CANCELED',
            updated_at = GETDATE()
        WHERE order_id = @p_order_id;
        
        -- 결제 정보 취소 처리
        UPDATE TB_COF_PYMNT_DTLS
        SET status = 'CANCELED',
            cancelled_at = GETDATE(),
            cancel_reason = @p_cancel_reason,
            updated_at = GETDATE()
        WHERE order_id = @p_order_id;
        
        -- 포인트 사용 복구
        IF @v_point_discount > 0
        BEGIN
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, user_id, ip_address, 
                login_method, success, failure_reason, attempted_at
            ) VALUES (
                'POINT_REFUND', 'CANCEL_' + CAST(@p_order_id AS VARCHAR), @p_user_id, 'SERVER',
                'SYSTEM', 1, '주문취소 포인트 복구 +' + CAST(@v_point_discount AS VARCHAR) + '원', GETDATE()
            );
        END
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'주문이 취소되었습니다.';
        
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

