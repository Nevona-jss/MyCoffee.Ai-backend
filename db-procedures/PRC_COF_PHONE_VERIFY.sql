-- =============================================
-- 개선된 휴대폰 인증번호 확인 프로시저
-- PRC_COF_PHONE_VERIFY (IMPROVED VERSION)
-- =============================================

CREATE PROCEDURE [dbo].[PRC_COF_PHONE_VERIFY]
    @p_phone_number VARCHAR(20),
    @p_verification_code VARCHAR(6),
    @p_purpose VARCHAR(20) = 'SIGNUP',
    
    -- 출력 파라미터
    @p_verification_id INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_clean_phone VARCHAR(20);
    DECLARE @v_verification_id INT = NULL;
    DECLARE @v_attempts_count INT = 0;
    DECLARE @v_expires_at DATETIME2;
    DECLARE @v_stored_code VARCHAR(6);
    DECLARE @v_stored_phone VARCHAR(20);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 휴대폰 번호 정규화
        SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
        
        -- =====================================
        -- 1. 해당 휴대폰 번호의 가장 최근 인증번호 조회
        -- =====================================
        SELECT TOP 1 
            @v_verification_id = verification_id,
            @v_attempts_count = attempts_count,
            @v_expires_at = expires_at,
            @v_stored_code = verification_code,
            @v_stored_phone = phone_number
        FROM TB_COF_USER_PHON
        WHERE phone_number = @v_clean_phone 
            AND purpose = @p_purpose
            AND is_verified = 0
        ORDER BY created_at DESC;  -- 가장 최근 것만 선택
        
        -- =====================================
        -- 2. 인증번호 요청 내역이 없는 경우
        -- =====================================
        IF @v_verification_id IS NULL
        BEGIN
            SET @p_result_code = 'NO_VERIFICATION';
            SET @p_result_message = N'인증번호를 먼저 요청해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 3. 인증번호 만료 확인
        -- =====================================
        IF @v_expires_at < GETDATE()
        BEGIN
            SET @p_result_code = 'EXPIRED';
            SET @p_result_message = N'인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 4. 시도 횟수 확인 (5회 제한)
        -- =====================================
        IF @v_attempts_count >= 5
        BEGIN
            SET @p_result_code = 'TOO_MANY_ATTEMPTS';
            SET @p_result_message = N'인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 5. 시도 횟수 증가 (실패하더라도 기록)
        -- =====================================
        UPDATE TB_COF_USER_PHON
        SET attempts_count = attempts_count + 1
        WHERE verification_id = @v_verification_id;
        
        -- =====================================
        -- 6. 휴대폰 번호 일치 확인 (추가된 검증)
        -- =====================================
        IF @v_stored_phone != @v_clean_phone
        BEGIN
            SET @p_result_code = 'PHONE_MISMATCH';
            SET @p_result_message = N'입력하신 휴대폰 번호가 인증번호를 요청한 번호와 일치하지 않습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 7. 인증번호 일치 확인
        -- =====================================
        IF @v_stored_code != @p_verification_code
        BEGIN
            SET @p_result_code = 'INVALID_CODE';
            SET @p_result_message = N'인증번호가 일치하지 않습니다. 다시 확인해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 8. 인증 성공 처리
        -- =====================================
        UPDATE TB_COF_USER_PHON
        SET is_verified = 1, 
            verified_at = GETDATE()
        WHERE verification_id = @v_verification_id;
        
        -- =====================================
        -- 9. 동일 번호의 이전 인증번호들 무효화 (보안 강화)
        -- =====================================
        UPDATE TB_COF_USER_PHON
        SET is_verified = 0,
            attempts_count = 999  -- 사용 불가 표시
        WHERE phone_number = @v_clean_phone 
            AND purpose = @p_purpose
            AND verification_id != @v_verification_id
            AND is_verified = 0;
        
        SET @p_verification_id = @v_verification_id;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'휴대폰 인증이 완료되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = N'인증 처리 중 오류가 발생했습니다: ' + ERROR_MESSAGE();
        SET @p_verification_id = NULL;
    END CATCH
END;
go

