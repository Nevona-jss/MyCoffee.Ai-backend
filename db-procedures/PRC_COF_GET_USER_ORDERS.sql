
-- =============================================
-- 5. 사용자 주문 내역 조회 프로시저
-- 화면: [12-01]주문/배송 조회_메인
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_GET_USER_ORDERS]
    @p_user_id INT,
    @p_status_filter VARCHAR(20) = NULL, -- 'ORDER_RECEIVED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'
    @p_page_size INT = 20,
    @p_page_number INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_offset INT = (@p_page_number - 1) * @p_page_size;
    
    SELECT 
        om.order_id,
        om.order_number,
        om.order_date,
        om.order_type,
        om.order_status,
        om.total_amount,
        om.final_amount,
        os.shipping_status,
        os.tracking_number,
        -- 주문 상품 정보 (첫 번째 상품만)
        (SELECT TOP 1 
            oi.collection_name + ' (' + cb.coffee_name + ')'
        FROM TB_COF_ORDR_ITEM oi
        INNER JOIN TB_COF_COFF_BLND cb ON oi.coffee_blend_id = cb.coffee_blend_id
        WHERE oi.order_id = om.order_id) AS first_item_name,
        (SELECT TOP 1 
            oi.caffeine_type + ' ' + oi.grind_type + ' ' + oi.package_type + ' ' + oi.weight_option
        FROM TB_COF_ORDR_ITEM oi
        WHERE oi.order_id = om.order_id) AS first_item_options,
        (SELECT TOP 1 
            CAST(oi.quantity AS VARCHAR) + '개 ' + FORMAT(oi.total_price, 'N0') + '원'
        FROM TB_COF_ORDR_ITEM oi
        WHERE oi.order_id = om.order_id) AS first_item_summary,
        (SELECT COUNT(*) FROM TB_COF_ORDR_ITEM WHERE order_id = om.order_id) AS total_items_count,
        -- 리뷰 작성 여부 확인 (간접적으로 로그 테이블 활용)
        CASE 
            WHEN EXISTS (SELECT 1 FROM TB_COF_LOGS_LGIN 
                        WHERE user_id = @p_user_id 
                        AND failure_reason LIKE '%리뷰 작성%' 
                        AND failure_reason LIKE '%' + om.order_number + '%')
            THEN 1 ELSE 0 
        END AS has_review
    FROM TB_COF_ORDR_MAIN om
    LEFT JOIN TB_COF_ORDR_SHIP os ON om.order_id = os.order_id
    WHERE om.user_id = @p_user_id
        AND om.deleted_at IS NULL
        AND (@p_status_filter IS NULL OR om.order_status = @p_status_filter)
    ORDER BY om.order_date DESC
    OFFSET @v_offset ROWS
    FETCH NEXT @p_page_size ROWS ONLY;
    
    -- 총 주문 건수
    SELECT COUNT(*) AS total_count
    FROM TB_COF_ORDR_MAIN om
    WHERE om.user_id = @p_user_id
        AND om.deleted_at IS NULL
        AND (@p_status_filter IS NULL OR om.order_status = @p_status_filter);
END;
go

