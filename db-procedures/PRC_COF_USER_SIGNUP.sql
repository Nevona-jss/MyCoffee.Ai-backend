-- =============================================
-- PRC_COF_USER_SIGNUP 프로시저 최종 수정
-- 생년월일, 성별 모두 필수 + 데이터 구분 명확화
-- =============================================

CREATE PROCEDURE [dbo].[PRC_COF_USER_SIGNUP]
    @p_validation_mode VARCHAR(20) = 'FULL_SIGNUP', -- 'EMAIL_ONLY', 'PASSWORD_ONLY', 'PHONE_ONLY', 'NAME_ONLY', 'FULL_SIGNUP'
    
    -- ================================
    -- 사용자 직접 입력 데이터 (UI 폼 데이터)
    -- ================================
    @p_email NVARCHAR(255) = NULL,               -- 피그마 "이메일" 입력 필드
    @p_password VARCHAR(255) = NULL,             -- 피그마 "비밀번호" 입력 필드  
    @p_name NVARCHAR(100) = NULL,                -- 피그마 "이름" 입력 필드 (한글 전용)
    @p_birth_year INT = NULL,                    -- 피그마 "출생년도" 선택박스 (필수)
    @p_birth_date DATE = NULL,                   -- 피그마 "생년월일" DatePicker (필수)
    @p_gender CHAR(1) = NULL,                    -- 피그마 "성별" 라디오버튼 (M/F, 필수)
    
    -- 휴대폰 인증 정보 (사용자 입력)
    @p_phone_number VARCHAR(20) = NULL,          -- 피그마 "휴대폰번호" 입력 필드
    @p_verification_code VARCHAR(6) = NULL,      -- 피그마 "인증번호" 입력 필드
    
    -- 약관 동의 (사용자 선택)
    @p_terms_agreed BIT = 0,                     -- 피그마 "이용약관 동의" 체크박스 (필수)
    @p_privacy_agreed BIT = 0,                   -- 피그마 "개인정보처리방침 동의" 체크박스 (필수)
    @p_marketing_agreed BIT = 0,                 -- 피그마 "마케팅 수신 동의" 체크박스 (선택)
    
    -- ================================
    -- 프론트엔드 자동 수집 데이터 (클라이언트 환경 정보)
    -- ================================
    @p_ip_address VARCHAR(45) = NULL,            -- 클라이언트 IP 주소 (자동 수집)
    @p_user_agent NTEXT = NULL,                  -- 브라우저 User-Agent (자동 수집)
    @p_device_type VARCHAR(20) = NULL,           -- 디바이스 타입: 'WEB', 'MOBILE_IOS', 'MOBILE_ANDROID' (자동 판별)
    @p_device_id NVARCHAR(100) = NULL,           -- 디바이스 고유 ID (자동 생성)
    @p_app_version VARCHAR(20) = NULL,           -- 앱 버전 정보 (자동 수집)
    
    -- ================================
    -- 출력 매개변수
    -- ================================
    @p_user_id INT OUTPUT,
    @p_session_id NVARCHAR(50) OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_existing_email_user_id INT = NULL;
    DECLARE @v_existing_phone_user_id INT = NULL;
    DECLARE @v_phone_verified BIT = 0;
    DECLARE @v_username NVARCHAR(50);
    DECLARE @v_password_hash VARCHAR(255);
    DECLARE @v_new_session_id NVARCHAR(50);
    DECLARE @v_session_expires_at DATETIME2;
    DECLARE @v_verification_id INT = NULL;
    DECLARE @v_clean_phone VARCHAR(20);
    
    -- 이메일 검증용 변수들
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
        
        -- =====================================
        -- 1. 이메일 검증 모드
        -- =====================================
        IF @p_validation_mode = 'EMAIL_ONLY'
        BEGIN
            -- 개선된 이메일 검증 로직
            IF @p_email IS NULL OR @p_email = '' OR LEN(LTRIM(RTRIM(@p_email))) = 0
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'이메일을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @p_email = LTRIM(RTRIM(@p_email));
            
            IF LEN(@p_email) > 255 OR LEN(@p_email) < 5
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_at_position = CHARINDEX('@', @p_email);
            IF @v_at_position = 0 OR @v_at_position = 1 OR @v_at_position = LEN(@p_email)
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            IF LEN(@p_email) - LEN(REPLACE(@p_email, '@', '')) > 1
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_email_local_part = LEFT(@p_email, @v_at_position - 1);
            SET @v_email_domain_part = SUBSTRING(@p_email, @v_at_position + 1, LEN(@p_email) - @v_at_position);
            
            IF LEN(@v_email_local_part) = 0 OR LEN(@v_email_local_part) > 64
               OR LEN(@v_email_domain_part) = 0 OR LEN(@v_email_domain_part) > 253
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_dot_position = CHARINDEX('.', @v_email_domain_part);
            IF @v_dot_position = 0 OR @v_dot_position = 1 OR @v_dot_position = LEN(@v_email_domain_part)
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_last_dot_position = LEN(@v_email_domain_part) - CHARINDEX('.', REVERSE(@v_email_domain_part)) + 1;
            SET @v_tld_part = SUBSTRING(@v_email_domain_part, @v_last_dot_position + 1, LEN(@v_email_domain_part) - @v_last_dot_position);
            
            IF LEN(@v_tld_part) < 2 OR LEN(@v_tld_part) > 4
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            IF @p_email LIKE '%..%' OR @p_email LIKE '%@.%' OR @p_email LIKE '%.@%'
               OR @p_email LIKE '% %' OR @p_email LIKE '%,%' OR @p_email LIKE '%;%'
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SELECT @v_existing_email_user_id = user_id
            FROM TB_COF_USER_ACCT 
            WHERE email = @p_email AND status = 'ACTIVE' AND deleted_at IS NULL;
            
            IF @v_existing_email_user_id IS NOT NULL
            BEGIN
                SET @p_result_code = 'EMAIL_DUPLICATE';
                SET @p_result_message = N'이미 가입된 메일주소입니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @p_result_code = 'SUCCESS';
            SET @p_result_message = N'사용 가능한 이메일입니다.';
            COMMIT TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 2. 비밀번호 검증 모드
        -- =====================================
        IF @p_validation_mode = 'PASSWORD_ONLY'
        BEGIN
            IF @p_password IS NULL OR LEN(@p_password) < 8 OR LEN(@p_password) > 20
            BEGIN
                SET @p_result_code = 'INVALID_PASSWORD';
                SET @p_result_message = N'8~20자의 영문과 숫자를 포함해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            IF @p_password NOT LIKE '%[0-9]%' OR @p_password NOT LIKE '%[A-Za-z]%'
            BEGIN
                SET @p_result_code = 'PASSWORD_FORMAT';
                SET @p_result_message = N'영문과 숫자를 모두 포함해야 합니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @p_result_code = 'SUCCESS';
            SET @p_result_message = N'사용 가능한 비밀번호입니다.';
            COMMIT TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 3. 휴대폰 검증 모드
        -- =====================================
        IF @p_validation_mode = 'PHONE_ONLY'
        BEGIN
            SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
            
            IF @v_clean_phone IS NULL OR LEN(@v_clean_phone) != 11 OR @v_clean_phone NOT LIKE '010%'
            BEGIN
                SET @p_result_code = 'INVALID_PHONE';
                SET @p_result_message = N'010으로 시작하는 11자리 번호를 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SELECT @v_existing_phone_user_id = user_id
            FROM TB_COF_USER_ACCT 
            WHERE phone_number = @v_clean_phone AND status = 'ACTIVE' AND deleted_at IS NULL;
            
            IF @v_existing_phone_user_id IS NOT NULL
            BEGIN
                SET @p_result_code = 'PHONE_DUPLICATE';
                SET @p_result_message = N'이미 가입된 휴대폰 번호입니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @p_result_code = 'SUCCESS';
            SET @p_result_message = N'사용 가능한 휴대폰 번호입니다.';
            COMMIT TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 4. 이름 검증 모드 (한글 전용)
        -- =====================================
        IF @p_validation_mode = 'NAME_ONLY'
        BEGIN
            IF @p_name IS NULL OR LEN(@p_name) < 2 OR LEN(@p_name) > 20
            BEGIN
                SET @p_result_code = 'INVALID_NAME';
                SET @p_result_message = N'2~20자의 한글을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 한글 검증 (가-힣 범위)
            IF @p_name COLLATE Korean_Wansung_CS_AS NOT LIKE N'[가-힣]%'
               OR @p_name COLLATE Korean_Wansung_CS_AS LIKE N'%[^가-힣]%'
            BEGIN
                SET @p_result_code = 'INVALID_NAME_FORMAT';
                SET @p_result_message = N'이름은 한글만 입력 가능합니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @p_result_code = 'SUCCESS';
            SET @p_result_message = N'사용 가능한 이름입니다.';
            COMMIT TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 5. 전체 회원가입 모드 (수정: 둘 다 필수)
        -- =====================================
        IF @p_validation_mode = 'FULL_SIGNUP'
        BEGIN
            -- 5-1. 필수 항목 검사 (생년월일, 출생년도, 성별 모두 필수)
            IF @p_email IS NULL OR @p_password IS NULL OR @p_name IS NULL OR @p_phone_number IS NULL
               OR @p_gender IS NULL OR @p_birth_date IS NULL OR @p_birth_year IS NULL
            BEGIN
                SET @p_result_code = 'MISSING_REQUIRED';
                SET @p_result_message = N'필수 정보를 모두 입력해주세요. (이메일, 비밀번호, 이름, 휴대폰번호, 성별, 생년월일, 출생년도)';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-1-1. 이름 한글 검증 (FULL_SIGNUP에서도 적용)
            IF @p_name IS NOT NULL
            BEGIN
                -- 한글 검증 (가-힣 범위)
                IF @p_name COLLATE Korean_Wansung_CS_AS NOT LIKE N'[가-힣]%'
                   OR @p_name COLLATE Korean_Wansung_CS_AS LIKE N'%[^가-힣]%'
                BEGIN
                    SET @p_result_code = 'INVALID_NAME_FORMAT';
                    SET @p_result_message = N'이름은 한글만 입력 가능합니다.';
                    ROLLBACK TRANSACTION;
                    RETURN;
                END
            END
            
            -- 5-2. 성별 값 검증 ('M' 또는 'F'만 허용)
            IF @p_gender NOT IN ('M', 'F')
            BEGIN
                SET @p_result_code = 'INVALID_GENDER';
                SET @p_result_message = N'성별을 올바르게 선택해주세요. (남성: M, 여성: F)';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-3. 생년월일 형식 검증 (필수)
            IF @p_birth_date IS NOT NULL
            BEGIN
                -- 생년월일이 미래 날짜인지 확인
                IF @p_birth_date > GETDATE()
                BEGIN
                    SET @p_result_code = 'INVALID_BIRTH_DATE';
                    SET @p_result_message = N'생년월일을 올바르게 입력해주세요.';
                    ROLLBACK TRANSACTION;
                    RETURN;
                END
                
                -- 생년월일이 1900년 이전인지 확인
                IF @p_birth_date < '1900-01-01'
                BEGIN
                    SET @p_result_code = 'INVALID_BIRTH_DATE';
                    SET @p_result_message = N'생년월일을 올바르게 입력해주세요.';
                    ROLLBACK TRANSACTION;
                    RETURN;
                END
            END
            
            -- 5-4. 출생년도 검증 (필수)
            IF @p_birth_year IS NOT NULL
            BEGIN
                -- 출생년도가 미래인지 확인
                IF @p_birth_year > YEAR(GETDATE())
                BEGIN
                    SET @p_result_code = 'INVALID_BIRTH_YEAR';
                    SET @p_result_message = N'출생년도를 올바르게 입력해주세요.';
                    ROLLBACK TRANSACTION;
                    RETURN;
                END
                
                -- 출생년도가 1900년 이전인지 확인
                IF @p_birth_year < 1900
                BEGIN
                    SET @p_result_code = 'INVALID_BIRTH_YEAR';
                    SET @p_result_message = N'출생년도를 올바르게 입력해주세요.';
                    ROLLBACK TRANSACTION;
                    RETURN;
                END
            END
            
            -- 5-5. 생년월일과 출생년도 일치성 검증 (추가 검증)
            IF YEAR(@p_birth_date) != @p_birth_year
            BEGIN
                SET @p_result_code = 'BIRTH_INFO_MISMATCH';
                SET @p_result_message = N'생년월일과 출생년도가 일치하지 않습니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-6. 개선된 이메일 검증 (EMAIL_ONLY와 동일)
            SET @p_email = LTRIM(RTRIM(@p_email));
            
            IF LEN(@p_email) > 255 OR LEN(@p_email) < 5
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_at_position = CHARINDEX('@', @p_email);
            IF @v_at_position = 0 OR @v_at_position = 1 OR @v_at_position = LEN(@p_email)
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            SET @v_email_domain_part = SUBSTRING(@p_email, @v_at_position + 1, LEN(@p_email) - @v_at_position);
            SET @v_dot_position = CHARINDEX('.', @v_email_domain_part);
            IF @v_dot_position = 0 OR @v_dot_position = 1 OR @v_dot_position = LEN(@v_email_domain_part)
            BEGIN
                SET @p_result_code = 'INVALID_EMAIL';
                SET @p_result_message = N'올바른 이메일 형식을 입력해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-7. 약관 동의 검사
            IF @p_terms_agreed = 0 OR @p_privacy_agreed = 0
            BEGIN
                SET @p_result_code = 'TERMS_NOT_AGREED';
                SET @p_result_message = N'필수 약관에 동의해주세요.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-8. 휴대폰 인증 확인
            SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
            
            SELECT TOP 1 @v_verification_id = verification_id
            FROM TB_COF_USER_PHON
            WHERE phone_number = @v_clean_phone 
                AND verification_code = @p_verification_code
                AND purpose = 'SIGNUP'
                AND is_verified = 1
                AND expires_at > GETDATE()
            ORDER BY created_at DESC;
            
            IF @v_verification_id IS NULL
            BEGIN
                SET @p_result_code = 'PHONE_NOT_VERIFIED';
                SET @p_result_message = N'휴대폰 인증이 필요합니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-9. 이메일 중복 검사
            SELECT @v_existing_email_user_id = user_id
            FROM TB_COF_USER_ACCT 
            WHERE email = @p_email AND status = 'ACTIVE' AND deleted_at IS NULL;
            
            IF @v_existing_email_user_id IS NOT NULL
            BEGIN
                SET @p_result_code = 'EMAIL_DUPLICATE';
                SET @p_result_message = N'이미 가입된 메일주소입니다.';
                ROLLBACK TRANSACTION;
                RETURN;
            END
            
            -- 5-10. 사용자명 생성 (이메일 @ 앞부분)
            SET @v_username = LEFT(@p_email, CHARINDEX('@', @p_email) - 1);
            
            -- 5-11. 비밀번호 해시
            SET @v_password_hash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @p_password), 2);
            
            -- 5-12. 사용자 등록
            INSERT INTO TB_COF_USER_ACCT (
                username, email, password_hash, name, birth_year, birth_date, 
                gender, phone_number, phone_verified, email_verified, status,
                created_at, updated_at
            ) VALUES (
                @v_username, @p_email, @v_password_hash, @p_name, @p_birth_year, @p_birth_date,
                @p_gender, @v_clean_phone, 1, 0, 'ACTIVE',
                GETDATE(), GETDATE()
            );
            
            -- 중요: 생성된 사용자 ID 가져오기
            SET @p_user_id = SCOPE_IDENTITY();
            
            -- 5-13. 약관 동의 기록
            INSERT INTO TB_COF_USER_AGRT (user_id, agreement_type, is_agreed, version, agreed_at)
            VALUES 
                (@p_user_id, 'TERMS_OF_SERVICE', @p_terms_agreed, '1.0', GETDATE()),
                (@p_user_id, 'PRIVACY_POLICY', @p_privacy_agreed, '1.0', GETDATE()),
                (@p_user_id, 'MARKETING_CONSENT', @p_marketing_agreed, '1.0', GETDATE());
            
            -- 5-14. 세션 생성 (프론트엔드 수집 정보 활용)
            SET @v_new_session_id = NEWID();
            SET @v_session_expires_at = DATEADD(DAY, 30, GETDATE());
            
            INSERT INTO TB_COF_USER_SESS (
                session_id, user_id, device_info, device_id, device_type, 
                app_version, ip_address, user_agent, login_method, 
                is_auto_login, expires_at, last_activity_at, created_at
            ) VALUES (
                @v_new_session_id, @p_user_id, N'회원가입', @p_device_id, @p_device_type,
                @p_app_version, @p_ip_address, @p_user_agent, 'EMAIL',
                0, @v_session_expires_at, GETDATE(), GETDATE()
            );
            
            -- 5-15. 로그인 기록 (프론트엔드 수집 정보 활용)
            INSERT INTO TB_COF_LOGS_LGIN (
                email_or_phone, masked_identifier, ip_address, user_agent, 
                login_method, success, user_id, attempted_at
            ) VALUES (
                @p_email, dbo.FN_COF_MASK_PHON(@v_clean_phone), @p_ip_address, @p_user_agent,
                'EMAIL', 1, @p_user_id, GETDATE()
            );
            
            SET @p_session_id = @v_new_session_id;
            SET @p_result_code = 'SUCCESS';
            SET @p_result_message = N'회원가입이 완료되었습니다.';
        END
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_user_id = NULL;
        SET @p_session_id = NULL;
    END CATCH
END;
go

