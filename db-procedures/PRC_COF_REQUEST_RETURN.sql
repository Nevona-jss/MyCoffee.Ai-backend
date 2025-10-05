
-- =============================================
-- 7. 반품 신청 프로시저
-- 화면: [12-09]반품하기
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_REQUEST_RETURN]
    @p_order_id INT,
    @p_user_id INT,
    @p_return_reason VARCHAR(50), -- '단순 변심', '주문 실수', '파손 불량', '오배송 및 지연'
    @p_return_detail NVARCHAR(300),
    @p_return_images NTEXT = NULL, -- JSON 배열 형태의 이미지 URL들
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_order_status VARCHAR(20);
    DECLARE @v_order_user_id INT;
    DECLARE @v_order_amount INT;
    DECLARE @v_point_used INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 주문 정보 확인
        SELECT 
            @v_order_status = order_status,
            @v_order_user_id = user_id,
            @v_order_amount = final_amount,
            @v_point_used = point_discount
        FROM TB_COF_ORDR_MAIN 
        WHERE order_id = @p_order_id AND deleted_at IS NULL;
        
        -- 주문 존재 및 권한 확인
        IF @v_order_user_id IS NULL
        BEGIN
            SET @p_result_code = 'ORDER_NOT_FOUND';
            SET @p_result_message = N'주문 정보를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @v_order_user_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'반품 신청 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 반품 가능 상태 확인 (배송완료 상태에서만)
        IF @v_order_status != 'DELIVERED'
        BEGIN
            SET @p_result_code = 'CANNOT_RETURN';
            SET @p_result_message = N'배송 완료된 주문만 반품 신청이 가능합니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 주문 상태를 반품 신청으로 변경
        UPDATE TB_COF_ORDR_MAIN
        SET order_status = 'RETURN_REQUESTED',
            updated_at = GETDATE()
        WHERE order_id = @p_order_id;
        
        -- 반품 로그 기록
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, user_id, ip_address, 
            login_method, success, failure_reason, attempted_at
        ) VALUES (
            'RETURN_REQUEST', 'ORDER_' + CAST(@p_order_id AS VARCHAR), @p_user_id, 'SERVER',
            'SYSTEM', 1, 
            N'반품신청: ' + @p_return_reason + N' - ' + @p_return_detail, 
            GETDATE()
        );
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'반품 신청이 완료되었습니다. 빠른 시일 내에 처리해드리겠습니다.';
        
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

