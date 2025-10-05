-- =============================================
-- 리뷰 삭제 프로시저
-- 화면: [06-02]리뷰_옵션 > 삭제
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_DELETE_REVIEW]
    @p_review_id INT,
    @p_user_id INT,
    
    -- 출력 매개변수
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_owner_id INT;
    DECLARE @v_point_amount INT = 0;
    DECLARE @v_point_status VARCHAR(20);
    DECLARE @v_user_points INT = 0;
    DECLARE @v_order_item_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 소유자 및 포인트 정보 확인
        SELECT 
            @v_owner_id = user_id,
            @v_point_amount = point_amount,
            @v_point_status = point_status,
            @v_order_item_id = order_item_id
        FROM TB_COF_REVI_MAIN
        WHERE review_id = @p_review_id
            AND deleted_at IS NULL;
        
        IF @v_owner_id IS NULL
        BEGIN
            SET @p_result_code = 'NOT_FOUND';
            SET @p_result_message = N'리뷰를 찾을 수 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @v_owner_id != @p_user_id
        BEGIN
            SET @p_result_code = 'NO_PERMISSION';
            SET @p_result_message = N'삭제 권한이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 포인트 지급 완료된 경우 포인트 차감 검증
        IF @v_point_status = 'APPROVED' AND @v_point_amount > 0
        BEGIN
            -- 사용자 보유 포인트 계산
            SELECT @v_user_points = ISNULL(
                (SELECT SUM(CASE 
                    WHEN failure_reason LIKE '%적립%' THEN CAST(REPLACE(REPLACE(failure_reason, '+', ''), '원', '') AS INT)
                    WHEN failure_reason LIKE '%사용%' THEN -CAST(REPLACE(REPLACE(failure_reason, '-', ''), '원', '') AS INT)
                    ELSE 0 
                END)
                FROM TB_COF_LOGS_LGIN 
                WHERE user_id = @p_user_id 
                AND failure_reason LIKE '%포인트%'), 0);
            
            IF @v_user_points < @v_point_amount
            BEGIN
                SET @p_result_code = 'INSUFFICIENT_POINTS';
                SET @p_result_message = N'지급된 포인트를 모두 사용하여 리뷰를 삭제할 수 없습니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 포인트 차감 로그
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, user_id, ip_address, 
                login_method, success, failure_reason, attempted_at
            ) VALUES (
                'POINT_DEDUCT', 'REVIEW_DELETE_' + CAST(@p_review_id AS VARCHAR), @p_user_id, 'SERVER',
                'SYSTEM', 1, '리뷰 작성 삭제 -' + CAST(@v_point_amount AS VARCHAR) + '원', GETDATE()
            );
        END
        
        -- 리뷰 소프트 삭제
        UPDATE TB_COF_REVI_MAIN
        SET deleted_at = GETDATE(),
            updated_at = GETDATE()
        WHERE review_id = @p_review_id;
        
        -- 주문 아이템의 리뷰 플래그 업데이트
        UPDATE TB_COF_ORDR_ITEM
        SET has_review = 0,
            updated_at = GETDATE()
        WHERE order_item_id = @v_order_item_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'리뷰가 삭제되었습니다.';
        
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

