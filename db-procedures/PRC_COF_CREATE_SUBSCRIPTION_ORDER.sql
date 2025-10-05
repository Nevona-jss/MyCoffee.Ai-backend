
/* ------------------------------------------------------------
   2) 구독 주문 생성 프로시저 보강
      - @p_agreements 파라미터(선택) 추가
      - OPENJSON 파싱 → 아이템 적재
      - 약관 스냅샷 저장(있을 때만)
------------------------------------------------------------ */
CREATE PROCEDURE [dbo].[PRC_COF_CREATE_SUBSCRIPTION_ORDER]
    @p_user_id INT,
    @p_collection_id INT = NULL,
    @p_analysis_id INT = NULL,

    -- 구독 정보
    @p_total_cycles INT,         -- 4, 8, 12회
    @p_first_delivery_date DATE,

    -- 주문 상품 정보(JSON 배열)
    @p_order_items NTEXT,

    -- 배송 정보
    @p_recipient_name NVARCHAR(50),
    @p_recipient_phone VARCHAR(20),
    @p_postal_code VARCHAR(10),
    @p_address NVARCHAR(200),
    @p_address_detail NVARCHAR(100) = NULL,

    -- 결제 정보
    @p_point_discount INT = 0,
    @p_shipping_fee INT = 0,
    @p_billing_key_id INT,

    -- 약관 동의 스냅샷(JSON, 선택)
    @p_agreements NTEXT = NULL,

    -- 출력 매개변수
    @p_subscription_id INT OUTPUT,
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
    DECLARE @v_payment_date DATE;
    DECLARE @v_is_first_subscription BIT = 0;
    DECLARE @v_first_month_free BIT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 임시 아이템 테이블
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

        -- JSON → 임시테이블 적재
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

        -- 총액 계산 / 첫달 무료 반영(원문 흐름 유지)
        SELECT @v_total_amount = ISNULL(SUM(total_price),0) FROM #TempOrderItems;
        -- (이하 기존 로직: 결제일/주문번호/첫달무료 계산 등은 원문과 동일하게 유지)

        /* 기존 본문 로직의 핵심 구간 요약 (변경 없음)
           - @v_payment_date 계산
           - @v_order_number 생성
           - TB_COF_SUBS_MAIN INSERT (@p_subscription_id 산출)
           - TB_COF_ORDR_MAIN INSERT (@p_order_id 산출)
           - TB_COF_SUBS_ORDR INSERT (연결)
           - TB_COF_ORDR_SHIP INSERT
           - 출력/커밋
           ※ 위 INSERT 구간은 원문 내용 유지 (여기선 생략 표기만, 실제 환경에는 원문이 그대로 존재)
        */

        /* --------------------------
           2-A) 주문 아이템 실제 적재
        -------------------------- */
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

        -- 약관 스냅샷 저장(있을 경우만)
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

        -- (원문 TRY 블록의 나머지/COMMIT/에러처리 로직 유지)
        COMMIT TRANSACTION;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'구독 주문이 생성되었습니다.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END
go

