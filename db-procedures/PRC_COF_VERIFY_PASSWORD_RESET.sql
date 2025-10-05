-- =============================================
-- MyCoffee.AI 프로젝트 - 비밀번호 찾기 프로시저 분리 설계
-- 피그마 UI 플로우에 맞춘 2단계 분리
-- =============================================

-- =============================================
-- 1단계: PRC_COF_VERIFY_PASSWORD_RESET
-- 화면: [02-07]비밀번호찾기
-- 용도: 아이디/이메일 + 휴대폰 인증 검증 후 재설정 토큰 생성
-- =============================================

CREATE PROCEDURE [dbo].[PRC_COF_VERIFY_PASSWORD_RESET]
    -- 피그마 [02-07] 입력 필드
    @p_email_or_username NVARCHAR(255),    -- 피그마 "아이디 또는 이메일" 입력 필드
    @p_phone_number VARCHAR(20),           -- 피그마 "휴대폰 번호" 입력 필드  
    @p_verification_code VARCHAR(6),       -- 피그마 "인증 번호" 입력 필드
    
    -- 출력 매개변수
    @p_reset_token VARCHAR(100) OUTPUT,    -- 재설정용 임시 토큰 (02-08 화면에서 사용)
    @p_user_id INT OUTPUT,                 -- 확인된 사용자 ID
    @p_masked_email NVARCHAR(255) OUTPUT,  -- 마스킹된 이메일 (확인용)
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_user_id INT = NULL;
    DECLARE @v_user_email NVARCHAR(255);
    DECLARE @v_user_phone VARCHAR(20);
    DECLARE @v_clean_phone VARCHAR(20);
    DECLARE @v_verification_id INT = NULL;
    DECLARE @v_reset_token VARCHAR(100);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_reset_token = NULL;
        SET @p_user_id = NULL;
        SET @p_masked_email = NULL;
        
        -- 휴대폰 번호 정규화
        SET @v_clean_phone = REPLACE(REPLACE(@p_phone_number, '-', ''), ' ', '');
        
        -- =====================================
        -- 1. 아이디/이메일로 사용자 계정 조회
        -- =====================================
        SELECT 
            @v_user_id = user_id,
            @v_user_email = email,
            @v_user_phone = phone_number
        FROM TB_COF_USER_ACCT 
        WHERE (email = @p_email_or_username OR username = @p_email_or_username)
            AND status = 'ACTIVE' 
            AND deleted_at IS NULL;
        
        -- 계정 존재 여부 확인
        IF @v_user_id IS NULL
        BEGIN
            SET @p_result_code = 'ACCOUNT_NOT_FOUND';
            SET @p_result_message = N'해당 아이디 또는 이메일로 가입된 계정이 없습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 2. 아이디와 휴대폰번호 일치 확인
        -- =====================================
        IF @v_user_phone != @v_clean_phone
        BEGIN
            SET @p_result_code = 'ACCOUNT_PHONE_MISMATCH';
            SET @p_result_message = N'입력하신 아이디와 휴대폰번호가 일치하지 않습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 3. 휴대폰 인증번호 확인
        -- =====================================
        SELECT TOP 1 @v_verification_id = verification_id
        FROM TB_COF_USER_PHON
        WHERE phone_number = @v_clean_phone 
            AND verification_code = @p_verification_code
            AND purpose = 'FIND_PASSWORD'
            AND is_verified = 1
            AND expires_at > GETDATE()
        ORDER BY created_at DESC;
        
        IF @v_verification_id IS NULL
        BEGIN
            -- 인증번호 만료 여부 확인
            IF EXISTS (SELECT 1 FROM TB_COF_USER_PHON 
                      WHERE phone_number = @v_clean_phone 
                        AND verification_code = @p_verification_code
                        AND purpose = 'FIND_PASSWORD'
                        AND expires_at <= GETDATE())
            BEGIN
                SET @p_result_code = 'VERIFICATION_EXPIRED';
                SET @p_result_message = N'인증 시간이 만료되었습니다. 다시 요청해주세요.';
            END
            ELSE
            BEGIN
                SET @p_result_code = 'VERIFICATION_INVALID';
                SET @p_result_message = N'인증 번호가 올바르지 않습니다.';
            END
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 4. 재설정 토큰 생성 및 저장
        -- =====================================
        SET @v_reset_token = NEWID();
        
        INSERT INTO TB_COF_USER_PASS (
            user_id, token, phone_number, is_used, 
            expires_at, created_at
        ) VALUES (
            @v_user_id, @v_reset_token, @v_clean_phone, 0,
            DATEADD(MINUTE, 10, GETDATE()), GETDATE()  -- 10분 유효
        );
        
        -- =====================================
        -- 5. 성공 결과 반환
        -- =====================================
        SET @p_reset_token = @v_reset_token;
        SET @p_user_id = @v_user_id;
        
        -- 이메일 마스킹 (user@domain.com → u***@domain.com)
        DECLARE @at_pos INT = CHARINDEX('@', @v_user_email);
        SET @p_masked_email = LEFT(@v_user_email, 1) + '***' + SUBSTRING(@v_user_email, @at_pos, LEN(@v_user_email) - @at_pos + 1);
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'본인 인증이 완료되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
    END CATCH
END;

go

