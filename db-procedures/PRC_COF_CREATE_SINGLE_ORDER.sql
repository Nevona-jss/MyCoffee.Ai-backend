
/* =========================================================
   HOTFIX: PRC_COF_CREATE_SINGLE_ORDER
   - TB_COF_LOGS_LGIN INSERT 컬럼을 attempted_at 으로 수정
   - 나머지 로직/주석/흐름 변경 없음
========================================================= */
CREATE PROCEDURE [dbo].[PRC_COF_CREATE_SINGLE_ORDER]
    @p_user_id INT,
    @p_collection_id INT = NULL,
    @p_analysis_id INT = NULL,

    @p_order_items NTEXT, -- JSON 배열

    -- 배송
    @p_recipient_name NVARCHAR(50),
    @p_recipient_phone VARCHAR(20),
    @p_postal_code VARCHAR(10),
    @p_address NVARCHAR(200),
    @p_address_detail NVARCHAR(100) = NULL,

    -- 결제
    @p_point_discount INT = 0,
    @p_shipping_fee INT = 0,
    @p_payment_method VARCHAR(50) = NULL,

    -- 약관(선택)
    @p_agreements NTEXT = NULL,

    -- 출력
    @p_order_id INT OUTPUT,
    @p_order_number VARCHAR(20) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_total_amount INT = 0;
    DECLARE @v_final_amount INT = 0;
    DECLARE @v_order_number VARCHAR(20);
    DECLARE @v_user_points INT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        SET @p_order_id = NULL;
        SET @p_order_number = NULL;

        -- 사용자 확인
        IF NOT EXISTS (
            SELECT 1 FROM TB_COF_USER_ACCT 
            WHERE user_id = @p_user_id AND status = 'ACTIVE'
        )
        BEGIN
            SET @p_result_code = 'INVALID_USER';
            SET @p_result_message = N'유효하지 않은 사용자입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 주문 아이템 파싱
        IF OBJECT_ID('tempdb..#TempOrderItems') IS NOT NULL DROP TABLE #TempOrderItems;
        CREATE TABLE #TempOrderItems (
            coffee_blend_id VARCHAR(20),
            collection_name NVARCHAR(50),
            caffeine_type   VARCHAR(20),
            grind_type      VARCHAR(20),
            package_type    VARCHAR(20),
            weight_option   VARCHAR(20),
            quantity        INT,
            unit_price      INT,
            total_price     INT,
            has_custom_label BIT
        );

        INSERT INTO #TempOrderItems (
            coffee_blend_id, collection_name, caffeine_type, grind_type,
            package_type, weight_option, quantity, unit_price, total_price, has_custom_label
        )
        SELECT
            j.coffee_blend_id, j.collection_name, j.caffeine_type, j.grind_type,
            j.package_type, j.weight_option, j.quantity, j.unit_price, j.total_price, j.has_custom_label
        FROM OPENJSON(@p_order_items)
        WITH (
            coffee_blend_id  VARCHAR(20)   '$.coffee_blend_id',
            collection_name  NVARCHAR(50)  '$.collection_name',
            caffeine_type    VARCHAR(20)   '$.caffeine_type',
            grind_type       VARCHAR(20)   '$.grind_type',
            package_type     VARCHAR(20)   '$.package_type',
            weight_option    VARCHAR(20)   '$.weight_option',
            quantity         INT           '$.quantity',
            unit_price       INT           '$.unit_price',
            total_price      INT           '$.total_price',
            has_custom_label BIT           '$.has_custom_label'
        ) AS j;

        SELECT @v_total_amount = ISNULL(SUM(total_price),0) FROM #TempOrderItems;

        -- 보유 포인트 계산 (원장 우선)
        IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.TB_COF_POINT_LEDGER') AND type = 'U')
        BEGIN
            SELECT @v_user_points = ISNULL(SUM(credit) - SUM(debit), 0)
            FROM dbo.TB_COF_POINT_LEDGER
            WHERE user_id = @p_user_id;
        END
        ELSE
        BEGIN
            -- 기존 임시 로깅 파싱 유지
            SELECT @v_user_points = ISNULL((
                SELECT TOP 1 TRY_CONVERT(INT, REPLACE(REPLACE(failure_reason,N'포인트:',N''),N'점',N''))
                FROM TB_COF_LOGS_LGIN 
                WHERE user_id = @p_user_id AND failure_reason LIKE N'%포인트%'
                ORDER BY attempted_at DESC
            ), 0);
        END

        -- 포인트 사용 검증
        IF @p_point_discount > @v_user_points
        BEGIN
            SET @p_result_code = 'INSUFFICIENT_POINTS';
            SET @p_result_message = N'보유 포인트가 부족합니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 최종 금액
        SET @v_final_amount = @v_total_amount + @p_shipping_fee - @p_point_discount;

        -- 주문번호
        SET @v_order_number = 'ORD' + FORMAT(GETDATE(), 'yyyyMMddHHmmss');

        -- 주문 메인
        INSERT INTO TB_COF_ORDR_MAIN (
            order_number, user_id, collection_id, analysis_id, order_type, order_status,
            total_amount, shipping_fee, point_discount, final_amount,
            payment_method, payment_status, order_date, created_at, updated_at
        )
        VALUES (
            @v_order_number, @p_user_id, @p_collection_id, @p_analysis_id, 'SINGLE', 'ORDER_RECEIVED',
            @v_total_amount, @p_shipping_fee, @p_point_discount, @v_final_amount,
            @p_payment_method, 'READY', GETDATE(), SYSUTCDATETIME(), SYSUTCDATETIME()
        );

        SET @p_order_id = SCOPE_IDENTITY();

        -- 주문 아이템 적재
        INSERT INTO TB_COF_ORDR_ITEM (
            order_id, coffee_blend_id, collection_name, caffeine_type, grind_type,
            package_type, weight_option, quantity, unit_price, total_price,
            has_custom_label, created_at, updated_at, has_review
        )
        SELECT
            @p_order_id, coffee_blend_id, collection_name, caffeine_type, grind_type,
            package_type, weight_option, quantity, unit_price, total_price,
            has_custom_label, SYSUTCDATETIME(), SYSUTCDATETIME(), 0
        FROM #TempOrderItems;

        -- 배송 저장
        INSERT INTO TB_COF_ORDR_SHIP (
            order_id, recipient_name, recipient_phone, postal_code,
            address, address_detail, shipping_status, created_at, updated_at
        )
        VALUES (
            @p_order_id, @p_recipient_name, @p_recipient_phone, @p_postal_code,
            @p_address, @p_address_detail, 'PREPARING', SYSUTCDATETIME(), SYSUTCDATETIME()
        );

        -- 포인트 사용 기록
        IF @p_point_discount > 0
        BEGIN
            IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.TB_COF_POINT_LEDGER') AND type = 'U')
            BEGIN
                INSERT INTO dbo.TB_COF_POINT_LEDGER (user_id, event_type, ref_type, ref_id, credit, debit, memo, created_at, updated_at)
                VALUES (@p_user_id, 'USE', 'ORDER', @p_order_id, 0, @p_point_discount, N'주문 차감', SYSUTCDATETIME(), SYSUTCDATETIME());
            END
            ELSE
            BEGIN
                /* 수정 포인트: TB_COF_LOGS_LGIN에는 attempted_at만 존재 */
                INSERT INTO TB_COF_LOGS_LGIN
                    (email_or_phone, masked_identifier, user_id, ip_address, success, failure_reason, attempted_at)
                VALUES
                    (N'', N'', @p_user_id, N'', 1, CONCAT(N'포인트:', @p_point_discount, N'점'), SYSUTCDATETIME());
            END
        END

        -- 약관 스냅샷
        IF @p_agreements IS NOT NULL
        BEGIN
            INSERT INTO dbo.TB_COF_ORDR_AGRT (order_id, agreement_key, is_agreed, version, agreed_at, created_at, updated_at)
            SELECT
                @p_order_id,
                j.[key],
                TRY_CONVERT(BIT, j.[agreed]),
                j.[version],
                SYSUTCDATETIME(),
                SYSUTCDATETIME(),
                SYSUTCDATETIME()
            FROM OPENJSON(@p_agreements)
            WITH (
                [key]     VARCHAR(50) '$.key',
                [agreed]  INT         '$.agreed',
                [version] VARCHAR(20) '$.version'
            ) AS j;
        END

        SET @p_order_number = @v_order_number;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'주문이 생성되었습니다.';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END
go

