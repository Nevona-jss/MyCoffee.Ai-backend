
-- =============================================
-- 6. 라벨 이미지 업로드 처리 프로시저
-- 화면: [05-07]주문하기_라벨옵션선택
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_SAVE_CUSTOM_LABEL]
    @p_order_item_id INT,
    @p_label_image_url NVARCHAR(500),
    @p_label_size VARCHAR(20), -- 'STICK_35X100', 'BUNDLE_70X120'
    
    -- 출력 매개변수
    @p_label_id INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 주문 아이템 존재 확인
        IF NOT EXISTS (SELECT 1 FROM TB_COF_ORDR_ITEM WHERE order_item_id = @p_order_item_id)
        BEGIN
            SET @p_result_code = 'INVALID_ORDER_ITEM';
            SET @p_result_message = N'유효하지 않은 주문 상품입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 기존 라벨 정보 확인 및 업데이트/신규 생성
        IF EXISTS (SELECT 1 FROM TB_COF_LABL_CSTM WHERE order_item_id = @p_order_item_id)
        BEGIN
            UPDATE TB_COF_LABL_CSTM
            SET label_image_url = @p_label_image_url,
                label_size = @p_label_size,
                upload_date = GETDATE(),
                updated_at = GETDATE()
            WHERE order_item_id = @p_order_item_id;
            
            SELECT @p_label_id = label_id 
            FROM TB_COF_LABL_CSTM 
            WHERE order_item_id = @p_order_item_id;
        END
        ELSE
        BEGIN
            INSERT INTO TB_COF_LABL_CSTM (
                order_item_id, label_image_url, label_size, 
                upload_date, created_at, updated_at
            ) VALUES (
                @p_order_item_id, @p_label_image_url, @p_label_size,
                GETDATE(), GETDATE(), GETDATE()
            );
            
            SET @p_label_id = SCOPE_IDENTITY();
        END
        
        -- 주문 아이템의 커스텀 라벨 플래그 업데이트
        UPDATE TB_COF_ORDR_ITEM
        SET has_custom_label = 1,
            updated_at = GETDATE()
        WHERE order_item_id = @p_order_item_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'커스텀 라벨이 저장되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_label_id = NULL;
    END CATCH
END;
go

