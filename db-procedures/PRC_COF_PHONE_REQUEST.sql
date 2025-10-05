
-- =============================================
-- 4. 아이디 찾기용 휴대폰 인증 프로시저
-- 4. english version:  아이디 찾기용 휴대폰 인증 프로시저
-- 4. english version:  Phone verification procedure for finding ID
-- =============================================

CREATE PROCEDURE dbo.PRC_COF_PHONE_REQUEST_FIND_ID
    @p_phone_number VARCHAR(20),
    
    -- 출력 파라미터
    @p_verification_code VARCHAR(6) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_clean_phone VARCHAR(20);
    DECLARE @v_account_count INT = 0;
    DECLARE @v_recent_attempts INT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 휴대폰 번호 정규화
        -- Normalize phone number
        SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
        
        -- 형식 검사
        IF @v_clean_phone IS NULL OR LEN(@v_clean_phone) != 11 OR @v_clean_phone NOT LIKE '010%'
        BEGIN
            SET @p_result_code = 'INVALID_PHONE';
            SET @p_result_message = N'010으로 시작하는 11자리 번호를 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 해당 번호로 가입된 계정이 있는지 확인
        SELECT @v_account_count = COUNT(*)
        FROM TB_COF_USER_ACCT
        WHERE phone_number = @v_clean_phone 
            AND status = 'ACTIVE' 
            AND deleted_at IS NULL;
        
        IF @v_account_count = 0
        BEGIN
            SET @p_result_code = 'NO_ACCOUNT_FOUND';
            SET @p_result_message = N'해당 번호로 가입된 계정이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 최근 5분 내 발송 횟수 확인 (스팸 방지)
        -- Check recent attempts (spam prevention)
        SELECT @v_recent_attempts = COUNT(*)
        FROM TB_COF_USER_PHON
        WHERE phone_number = @v_clean_phone 
            AND purpose = 'FIND_ID'
            AND created_at > DATEADD(MINUTE, -5, GETDATE());
        
        IF @v_recent_attempts >= 3
        BEGIN
            SET @p_result_code = 'TOO_MANY_REQUESTS';
            SET @p_result_message = N'너무 많은 요청입니다. 5분 후 다시 시도해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 인증번호 생성 (6자리 랜덤 숫자)
        -- Generate verification code (6-digit random number)
        SET @p_verification_code = FORMAT(CAST(RAND() * 1000000 AS INT), '000000');
        
        -- 인증번호 저장
        -- Save verification code
        INSERT INTO TB_COF_USER_PHON (
            phone_number, verification_code, purpose, user_id, 
            is_verified, attempts_count, expires_at, created_at
        ) VALUES (
            @v_clean_phone, @p_verification_code, 'FIND_ID', NULL,
            0, 0, DATEADD(MINUTE, 3, GETDATE()), GETDATE()
        );
        
        -- 인증 완료 처리 (실제 SMS 발송이 성공했다고 가정)
        -- Complete verification (assuming SMS sending was successful)
        UPDATE TB_COF_USER_PHON
        SET is_verified = 1, verified_at = GETDATE()
        WHERE phone_number = @v_clean_phone 
            AND verification_code = @p_verification_code
            AND purpose = 'FIND_ID';
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'인증번호가 발송되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

