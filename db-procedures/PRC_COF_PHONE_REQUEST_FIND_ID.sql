
-- =============================================
-- 2. 휴대폰 인증번호 발송 프로시저
-- =============================================

CREATE PROCEDURE dbo.PRC_COF_PHONE_REQUEST
    @p_phone_number VARCHAR(20),
    @p_purpose VARCHAR(20) = 'SIGNUP', -- 'SIGNUP', 'LOGIN', 'FIND_ID'
    @p_user_id INT = NULL,
    
    -- 출력 파라미터
    @p_verification_code VARCHAR(6) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_clean_phone VARCHAR(20);
    DECLARE @v_existing_user_id INT = NULL;
    DECLARE @v_recent_attempts INT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 휴대폰 번호 정규화
        SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
        
        -- 형식 검사
        IF @v_clean_phone IS NULL OR LEN(@v_clean_phone) != 11 OR @v_clean_phone NOT LIKE '010%'
        BEGIN
            SET @p_result_code = 'INVALID_PHONE';
            SET @p_result_message = N'010으로 시작하는 11자리 번호를 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 최근 5분 내 발송 횟수 확인 (스팸 방지)
        SELECT @v_recent_attempts = COUNT(*)
        FROM TB_COF_USER_PHON
        WHERE phone_number = @v_clean_phone 
            AND created_at > DATEADD(MINUTE, -5, GETDATE());
        
        IF @v_recent_attempts >= 3
        BEGIN
            SET @p_result_code = 'TOO_MANY_REQUESTS';
            SET @p_result_message = N'너무 많은 요청입니다. 5분 후 다시 시도해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 회원가입용인 경우 중복 검사
        IF @p_purpose = 'SIGNUP'
        BEGIN
            SELECT @v_existing_user_id = user_id
            FROM TB_COF_USER_ACCT
            WHERE phone_number = @v_clean_phone AND status = 'ACTIVE';
            
            IF @v_existing_user_id IS NOT NULL
            BEGIN
                SET @p_result_code = 'PHONE_DUPLICATE';
                SET @p_result_message = N'이미 가입된 휴대폰 번호입니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
        END
        
        -- 인증번호 생성 (6자리 랜덤 숫자)
        SET @p_verification_code = FORMAT(CAST(RAND() * 1000000 AS INT), '000000');
        
        -- 인증번호 저장
        INSERT INTO TB_COF_USER_PHON (
            phone_number, verification_code, purpose, user_id, 
            is_verified, attempts_count, expires_at, created_at
        ) VALUES (
            @v_clean_phone, @p_verification_code, @p_purpose, @p_user_id,
            0, 0, DATEADD(MINUTE, 3, GETDATE()), GETDATE()
        );
        
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

