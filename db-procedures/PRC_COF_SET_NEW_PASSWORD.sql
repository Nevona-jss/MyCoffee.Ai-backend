
-- =============================================
-- 2단계: PRC_COF_SET_NEW_PASSWORD
-- 화면: [02-08]비밀번호재설정
-- 용도: 재설정 토큰으로 새 비밀번호 설정
-- =============================================

CREATE PROCEDURE [dbo].[PRC_COF_SET_NEW_PASSWORD]
    -- 피그마 [02-08] 입력 필드
    @p_reset_token VARCHAR(100),           -- 1단계에서 생성된 재설정 토큰
    @p_new_password VARCHAR(255),          -- 피그마 "새 비밀번호" 입력 필드
    @p_new_password_confirm VARCHAR(255),  -- 피그마 "새 비밀번호 확인" 입력 필드
    
    -- 출력 매개변수
    @p_user_id INT OUTPUT,                 -- 비밀번호가 변경된 사용자 ID
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_user_id INT = NULL;
    DECLARE @v_token_id INT = NULL;
    DECLARE @v_current_password_hash VARCHAR(255);
    DECLARE @v_new_password_hash VARCHAR(255);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_user_id = NULL;
        
        -- =====================================
        -- 1. 비밀번호 확인 일치 검사
        -- =====================================
        IF @p_new_password != @p_new_password_confirm
        BEGIN
            SET @p_result_code = 'PASSWORD_MISMATCH';
            SET @p_result_message = N'새 비밀번호가 일치하지 않습니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 2. 새 비밀번호 형식 검사
        -- =====================================
        IF @p_new_password IS NULL OR LEN(@p_new_password) < 8 OR LEN(@p_new_password) > 20
        BEGIN
            SET @p_result_code = 'INVALID_PASSWORD_LENGTH';
            SET @p_result_message = N'8~20자의 영문과 숫자를 포함해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 영문+숫자 포함 검사
        IF @p_new_password NOT LIKE '%[0-9]%' OR @p_new_password NOT LIKE '%[A-Za-z]%'
        BEGIN
            SET @p_result_code = 'INVALID_PASSWORD_FORMAT';
            SET @p_result_message = N'8~20자의 영문과 숫자를 포함해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 3. 재설정 토큰 검증
        -- =====================================
        SELECT 
            @v_token_id = token_id,
            @v_user_id = user_id
        FROM TB_COF_USER_PASS
        WHERE token = @p_reset_token 
            AND is_used = 0 
            AND expires_at > GETDATE();
        
        IF @v_token_id IS NULL
        BEGIN
            SET @p_result_code = 'TOKEN_INVALID';
            SET @p_result_message = N'재설정 요청이 만료되었습니다. 다시 시도해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 4. 기존 비밀번호와 동일 여부 확인
        -- =====================================
        SELECT @v_current_password_hash = password_hash
        FROM TB_COF_USER_ACCT
        WHERE user_id = @v_user_id;
        
        SET @v_new_password_hash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @p_new_password), 2);
        
        IF @v_current_password_hash = @v_new_password_hash
        BEGIN
            SET @p_result_code = 'SAME_PASSWORD';
            SET @p_result_message = N'기존 비밀번호와 다른 비밀번호를 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- =====================================
        -- 5. 비밀번호 업데이트
        -- =====================================
        UPDATE TB_COF_USER_ACCT
        SET password_hash = @v_new_password_hash, 
            updated_at = GETDATE()
        WHERE user_id = @v_user_id;
        
        -- =====================================
        -- 6. 토큰 사용 처리
        -- =====================================
        UPDATE TB_COF_USER_PASS
        SET is_used = 1, 
            used_at = GETDATE()
        WHERE token_id = @v_token_id;
        
        -- =====================================
        -- 7. 기존 세션 무효화 (보안)
        -- =====================================
        UPDATE TB_COF_USER_SESS
        SET expires_at = GETDATE()
        WHERE user_id = @v_user_id 
            AND expires_at > GETDATE();
        
        -- =====================================
        -- 8. 성공 결과 반환
        -- =====================================
        SET @p_user_id = @v_user_id;
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'비밀번호 재설정이 완료되었습니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_user_id = NULL;
    END CATCH
END;

go

