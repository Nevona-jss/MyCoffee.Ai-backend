
-- =============================================
-- 4. 주문 상세 조회 프로시저
-- 화면: [12-12]주문/배송 조회_상세화면
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_GET_ORDER_DETAIL]
    @p_order_id INT,
    @p_user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 주문 기본 정보
    SELECT 
        om.order_id,
        om.order_number,
        om.order_date,
        om.order_type,
        om.order_status,
        om.total_amount,
        om.shipping_fee,
        om.point_discount,
        om.final_amount,
        om.payment_method,
        om.payment_status,
        ua.name AS order_user_name,
        -- 배송지 정보
        os.recipient_name,
        os.recipient_phone,
        os.postal_code,
        os.address,
        os.address_detail,
        os.shipping_status,
        os.tracking_number,
        os.courier_company,
        os.shipped_at,
        os.delivered_at
    FROM TB_COF_ORDR_MAIN om
    INNER JOIN TB_COF_USER_ACCT ua ON om.user_id = ua.user_id
    LEFT JOIN TB_COF_ORDR_SHIP os ON om.order_id = os.order_id
    WHERE om.order_id = @p_order_id 
        AND om.user_id = @p_user_id
        AND om.deleted_at IS NULL;
    
    -- 주문 상품 정보
    SELECT 
        oi.order_item_id,
        oi.coffee_blend_id,
        cb.coffee_name,
        oi.collection_name,
        oi.caffeine_type,
        oi.grind_type,
        oi.package_type,
        oi.weight_option,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.has_custom_label,
        -- 커스텀 라벨 정보
        lc.label_image_url,
        lc.label_size
    FROM TB_COF_ORDR_ITEM oi
    INNER JOIN TB_COF_COFF_BLND cb ON oi.coffee_blend_id = cb.coffee_blend_id
    LEFT JOIN TB_COF_LABL_CSTM lc ON oi.order_item_id = lc.order_item_id
    WHERE oi.order_id = @p_order_id
    ORDER BY oi.order_item_id;
    
    -- 결제 정보
    SELECT 
        pd.payment_id,
        pd.payment_key,
        pd.order_id_toss,
        pd.amount,
        pd.method,
        pd.status,
        pd.requested_at,
        pd.approved_at,
        pd.receipt_url,
        pd.failure_code,
        pd.failure_message,
        pd.cancelled_at,
        pd.cancel_amount,
        pd.cancel_reason
    FROM TB_COF_PYMNT_DTLS pd
    WHERE pd.order_id = @p_order_id;
END;
go

