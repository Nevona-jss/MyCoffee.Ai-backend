-- =============================================
-- 리뷰 포인트 승인 배치 프로시저
-- 기능: 48시간 경과 후 리뷰 포인트 자동 승인
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_APPROVE_REVIEW_POINTS]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_approved_count INT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 48시간 경과한 리뷰의 포인트 승인
        UPDATE TB_COF_REVI_MAIN
        SET point_status = 'APPROVED',
            point_approved_at = GETDATE(),
            updated_at = GETDATE()
        WHERE point_status = 'PENDING'
            AND created_at <= DATEADD(HOUR, -48, GETDATE())
            AND deleted_at IS NULL;
        
        SET @v_approved_count = @@ROWCOUNT;
        
        -- 승인된 리뷰에 대한 포인트 적립 로그 생성
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, user_id, ip_address, 
            login_method, success, failure_reason, attempted_at
        )
        SELECT 
            'POINT_EARN',
            'REVIEW_' + CAST(review_id AS VARCHAR),
            user_id,
            'SERVER',
            'SYSTEM',
            1,
            '리뷰 작성 보상 적립 +' + CAST(point_amount AS VARCHAR) + '원',
            GETDATE()
        FROM TB_COF_REVI_MAIN
        WHERE point_status = 'APPROVED'
            AND point_approved_at >= DATEADD(MINUTE, -1, GETDATE());
        
        -- 배치 실행 로그
        IF @v_approved_count > 0
        BEGIN
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, 
                login_method, success, failure_reason, attempted_at
            ) VALUES (
                'SYSTEM', 'BATCH_REVIEW_POINT_APPROVAL', 'SERVER',
                'SYSTEM', 1, 'Approved ' + CAST(@v_approved_count AS VARCHAR) + ' review points', 
                GETDATE()
            );
        END
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        -- 에러 로그 기록
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, ip_address, 
            login_method, success, failure_reason, attempted_at
        ) VALUES (
            'SYSTEM', 'BATCH_ERROR', 'SERVER',
            'SYSTEM', 0, 'Review point approval error: ' + ERROR_MESSAGE(), GETDATE()
        );
    END CATCH
END;
go

