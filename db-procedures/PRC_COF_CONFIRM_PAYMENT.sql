
CREATE PROCEDURE [dbo].[PRC_COF_CONFIRM_PAYMENT]
    @p_order_id       INT,
    @p_payment_key    VARCHAR(200),
    @p_order_id_toss  VARCHAR(64),
    @p_amount         INT,
    @p_method         VARCHAR(20),
    @p_status         VARCHAR(20),       -- APPROVED | CANCELED | FAILED 등
    @p_receipt_url    VARCHAR(500) = NULL,
    @p_checkout_url   VARCHAR(500) = NULL,
    @p_failure_code   VARCHAR(50)  = NULL,
    @p_failure_message NVARCHAR(500) = NULL,

    @p_result_code    VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 결제 상세 UPSERT 성격(단순화)
        IF EXISTS (SELECT 1 FROM dbo.TB_COF_PYMNT_DTLS WHERE order_id = @p_order_id)
        BEGIN
            UPDATE dbo.TB_COF_PYMNT_DTLS
            SET payment_key   = @p_payment_key,
                order_id_toss = @p_order_id_toss,
                amount        = @p_amount,
                method        = @p_method,
                status        = @p_status,
                approved_at   = CASE WHEN @p_status IN ('APPROVED','PAID') THEN SYSUTCDATETIME() ELSE approved_at END,
                receipt_url   = @p_receipt_url,
                checkout_url  = @p_checkout_url,
                failure_code  = @p_failure_code,
                failure_message = @p_failure_message,
                updated_at    = SYSUTCDATETIME()
            WHERE order_id = @p_order_id;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.TB_COF_PYMNT_DTLS
            (order_id, payment_key, order_id_toss, amount, method, status,
             requested_at, approved_at, receipt_url, checkout_url, secret,
             failure_code, failure_message, cancelled_at, cancel_amount, cancel_reason,
             created_at, updated_at)
            VALUES
            (@p_order_id, @p_payment_key, @p_order_id_toss, @p_amount, @p_method, @p_status,
             SYSUTCDATETIME(),
             CASE WHEN @p_status IN ('APPROVED','PAID') THEN SYSUTCDATETIME() ELSE NULL END,
             @p_receipt_url, @p_checkout_url, NULL,
             @p_failure_code, @p_failure_message, NULL, NULL, NULL,
             SYSUTCDATETIME(), SYSUTCDATETIME());
        END

        -- 주문 결제상태 전이
        IF @p_status IN ('APPROVED','PAID')
        BEGIN
            UPDATE dbo.TB_COF_ORDR_MAIN
            SET payment_status = 'PAID',
                updated_at = SYSUTCDATETIME()
            WHERE order_id = @p_order_id;
        END
        ELSE IF @p_status IN ('CANCELED','CANCELLED')
        BEGIN
            UPDATE dbo.TB_COF_ORDR_MAIN
            SET payment_status = 'CANCELLED',
                order_status   = 'CANCELLED',
                updated_at = SYSUTCDATETIME()
            WHERE order_id = @p_order_id;
        END

        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'결제 상태가 반영되었습니다.';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END
go

