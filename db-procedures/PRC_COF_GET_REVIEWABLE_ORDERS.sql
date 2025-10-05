-- =============================================
-- 작성 가능한 리뷰 목록 조회 프로시저
-- 화면: [13-03]내리뷰_리뷰작성
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_GET_REVIEWABLE_ORDERS]
    @p_user_id INT,
    @p_page_size INT = 20,
    @p_page_number INT = 1,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_offset INT = (@p_page_number - 1) * @p_page_size;
    
    BEGIN TRY
        -- 리뷰 작성 가능한 주문 아이템 조회
        SELECT 
            om.order_id,
            om.order_number,
            om.order_date,
            oi.order_item_id,
            oi.coffee_blend_id,
            cb.coffee_name,
            oi.collection_name,
            oi.caffeine_type,
            oi.grind_type,
            oi.package_type,
            oi.weight_option,
            oi.quantity,
            oi.total_price,
            os.delivered_at
        FROM TB_COF_ORDR_ITEM oi
        INNER JOIN TB_COF_ORDR_MAIN om ON oi.order_id = om.order_id
        INNER JOIN TB_COF_COFF_BLND cb ON oi.coffee_blend_id = cb.coffee_blend_id
        INNER JOIN TB_COF_ORDR_SHIP os ON om.order_id = os.order_id
        WHERE om.user_id = @p_user_id
            AND om.order_status = 'DELIVERED'  -- 배송 완료
            AND oi.has_review = 0              -- 리뷰 미작성
            AND om.deleted_at IS NULL
        ORDER BY om.order_date DESC
        OFFSET @v_offset ROWS
        FETCH NEXT @p_page_size ROWS ONLY;
        
        -- 전체 개수 조회
        SELECT COUNT(*) AS total_count
        FROM TB_COF_ORDR_ITEM oi
        INNER JOIN TB_COF_ORDR_MAIN om ON oi.order_id = om.order_id
        WHERE om.user_id = @p_user_id
            AND om.order_status = 'DELIVERED'
            AND oi.has_review = 0
            AND om.deleted_at IS NULL;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'작성 가능한 리뷰 목록 조회 완료';
        
    END TRY
    BEGIN CATCH
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

