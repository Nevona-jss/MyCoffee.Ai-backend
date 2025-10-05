-- =============================================
-- 기존 PRC_COF_EMAIL_LOGIN 프로시저 개선
-- 기획서 요구사항에 맞춰 메시지 및 이메일 형식 검증 추가
-- =============================================

CREATE PROCEDURE [dbo].[PRC_COF_EMAIL_LOGIN]
    @p_email NVARCHAR(255),
    @p_password VARCHAR(255),
    @p_auto_login BIT = 0,
    
    -- 세션 정보
    @p_ip_address VARCHAR(45) = NULL,
    @p_user_agent NTEXT = NULL,
    @p_device_type VARCHAR(20) = NULL,
    @p_device_id NVARCHAR(100) = NULL,
    @p_app_version VARCHAR(20) = NULL,
    
    -- 출력 파라미터
    @p_user_id INT OUTPUT,
    @p_session_id NVARCHAR(50) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_stored_password_hash VARCHAR(255);
    DECLARE @v_user_status VARCHAR(20);
    DECLARE @v_new_session_id NVARCHAR(50);
    DECLARE @v_session_expires_at DATETIME2;
    DECLARE @v_input_password_hash VARCHAR(255);
    DECLARE @v_last_login_attempt DATETIME2;
    DECLARE @v_failed_attempts INT = 0;
    
    -- 이메일 검증용 변수들 추가
    DECLARE @v_at_position INT;
    DECLARE @v_dot_position INT;
    DECLARE @v_email_local_part VARCHAR(255);
    DECLARE @v_email_domain_part VARCHAR(255);
    DECLARE @v_last_dot_position INT;
    DECLARE @v_tld_part VARCHAR(10);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_user_id = NULL;
        SET @p_session_id = NULL;
        
        -- =============================================
        -- 1. 개별 필드 유효성 검사 (기획서 요구사항 반영)
        -- =============================================
        
        -- 1-1. 이메일 필수 입력 검사
        IF @p_email IS NULL OR @p_email = '' OR LEN(LTRIM(RTRIM(@p_email))) = 0
        BEGIN
            SET @p_result_code = 'MISSING_EMAIL';
            SET @p_result_message = N'이메일을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 1-2. 비밀번호 필수 입력 검사
        IF @p_password IS NULL OR @p_password = ''
        BEGIN
            SET @p_result_code = 'MISSING_PASSWORD';
            SET @p_result_message = N'비밀번호를 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 2. 이메일 형식 검증 추가 (기획서 요구사항)
        -- =============================================
        
        SET @p_email = LTRIM(RTRIM(@p_email));
        
        -- 기본 길이 검증
        IF LEN(@p_email) > 255 OR LEN(@p_email) < 5
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- @ 기호 존재 및 위치 검증
        SET @v_at_position = CHARINDEX('@', @p_email);
        IF @v_at_position = 0 OR @v_at_position = 1 OR @v_at_position = LEN(@p_email)
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 다중 @ 기호 검증
        IF LEN(@p_email) - LEN(REPLACE(@p_email, '@', '')) > 1
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 로컬/도메인 파트 분리 및 검증
        SET @v_email_local_part = LEFT(@p_email, @v_at_position - 1);
        SET @v_email_domain_part = SUBSTRING(@p_email, @v_at_position + 1, LEN(@p_email) - @v_at_position);
        
        -- 로컬 파트와 도메인 파트 길이 검증
        IF LEN(@v_email_local_part) = 0 OR LEN(@v_email_local_part) > 64
           OR LEN(@v_email_domain_part) = 0 OR LEN(@v_email_domain_part) > 253
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 도메인에 점(.) 존재 검증
        SET @v_dot_position = CHARINDEX('.', @v_email_domain_part);
        IF @v_dot_position = 0 OR @v_dot_position = 1 OR @v_dot_position = LEN(@v_email_domain_part)
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- TLD (최상위 도메인) 검증
        SET @v_last_dot_position = LEN(@v_email_domain_part) - CHARINDEX('.', REVERSE(@v_email_domain_part)) + 1;
        SET @v_tld_part = SUBSTRING(@v_email_domain_part, @v_last_dot_position + 1, LEN(@v_email_domain_part) - @v_last_dot_position);
        
        IF LEN(@v_tld_part) < 2 OR LEN(@v_tld_part) > 4
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 연속된 점, 특수문자 검증
        IF @p_email LIKE '%..%' OR @p_email LIKE '%@.%' OR @p_email LIKE '%.@%'
           OR @p_email LIKE '% %' OR @p_email LIKE '%,%' OR @p_email LIKE '%;%'
        BEGIN
            SET @p_result_code = 'INVALID_EMAIL_FORMAT';
            SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 3. 사용자 정보 조회
        -- =============================================
        SELECT 
            @p_user_id = user_id,
            @v_stored_password_hash = password_hash,
            @v_user_status = status
        FROM TB_COF_USER_ACCT 
        WHERE email = @p_email AND deleted_at IS NULL;
        
        -- =============================================
        -- 4. 계정 존재 여부 확인 (기획서 메시지 정확 반영)
        -- =============================================
        IF @p_user_id IS NULL
        BEGIN
            SET @p_result_code = 'USER_NOT_FOUND';
            SET @p_result_message = N'등록되지 않은 이메일입니다.';
            
            -- 실패 로그 기록
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, user_agent, 
                login_method, success, failure_reason, failure_code, attempted_at
            ) VALUES (
                @p_email, dbo.FN_COF_MASK_PHON(@p_email), @p_ip_address, @p_user_agent,
                'EMAIL', 0, N'등록되지 않은 이메일', 'USER_NOT_FOUND', GETDATE()
            );
            
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 5. 계정 상태 확인
        -- =============================================
        IF @v_user_status != 'ACTIVE'
        BEGIN
            SET @p_result_code = 'ACCOUNT_INACTIVE';
            SET @p_result_message = N'비활성화된 계정입니다. 고객센터에 문의해주세요.';
            
            -- 실패 로그 기록
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, user_agent, 
                login_method, success, failure_reason, failure_code, user_id, attempted_at
            ) VALUES (
                @p_email, dbo.FN_COF_MASK_PHON(@p_email), @p_ip_address, @p_user_agent,
                'EMAIL', 0, N'계정 비활성화', 'ACCOUNT_INACTIVE', @p_user_id, GETDATE()
            );
            
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 6. 로그인 시도 횟수 제한 확인 (5분 내 5회)
        -- =============================================
        SELECT @v_failed_attempts = COUNT(*)
        FROM TB_COF_LOGS_LGIN
        WHERE user_id = @p_user_id 
            AND success = 0 
            AND attempted_at > DATEADD(MINUTE, -5, GETDATE());
        
        IF @v_failed_attempts >= 5
        BEGIN
            SET @p_result_code = 'TOO_MANY_ATTEMPTS';
            SET @p_result_message = N'로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 7. 비밀번호 검증 (기획서 메시지 정확 반영)
        -- =============================================
        SET @v_input_password_hash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @p_password), 2);
        
        IF @v_stored_password_hash != @v_input_password_hash
        BEGIN
            SET @p_result_code = 'INVALID_PASSWORD';
            SET @p_result_message = N'비밀번호가 올바르지 않습니다.';
            
            -- 실패 로그 기록
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, user_agent, 
                login_method, success, failure_reason, failure_code, user_id, attempted_at
            ) VALUES (
                @p_email, dbo.FN_COF_MASK_PHON(@p_email), @p_ip_address, @p_user_agent,
                'EMAIL', 0, N'비밀번호 불일치', 'INVALID_PASSWORD', @p_user_id, GETDATE()
            );
            
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =============================================
        -- 8. 세션 생성
        -- =============================================
        SET @v_new_session_id = NEWID();
        
        -- 자동 로그인인 경우 30일, 아니면 24시간
        IF @p_auto_login = 1
        BEGIN
            SET @v_session_expires_at = DATEADD(DAY, 30, GETDATE());
        END
        ELSE
        BEGIN
            SET @v_session_expires_at = DATEADD(DAY, 1, GETDATE());
        END
        
        INSERT INTO TB_COF_USER_SESS (
            session_id, user_id, device_info, device_id, device_type, 
            app_version, ip_address, user_agent, login_method, 
            is_auto_login, expires_at, last_activity_at, created_at
        ) VALUES (
            @v_new_session_id, @p_user_id, N'이메일 로그인', @p_device_id, @p_device_type,
            @p_app_version, @p_ip_address, @p_user_agent, 'EMAIL',
            @p_auto_login, @v_session_expires_at, GETDATE(), GETDATE()
        );
        
        -- =============================================
        -- 9. 마지막 로그인 시간 업데이트
        -- =============================================
        UPDATE TB_COF_USER_ACCT
        SET last_login_at = GETDATE(), updated_at = GETDATE()
        WHERE user_id = @p_user_id;
        
        -- =============================================
        -- 10. 성공 로그 기록
        -- =============================================
        INSERT INTO TB_COF_LOGS_LGIN (
            email_or_phone, masked_identifier, ip_address, user_agent, 
            login_method, success, user_id, attempted_at
        ) VALUES (
            @p_email, dbo.FN_COF_MASK_PHON(@p_email), @p_ip_address, @p_user_agent,
            'EMAIL', 1, @p_user_id, GETDATE()
        );
        
        SET @p_session_id = @v_new_session_id;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'로그인이 완료되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;
go

