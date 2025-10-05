
------------------------------------------------
-- 3) PROC: CREATE OR ALTER (드롭 불필요, 최소 변경)
------------------------------------------------
CREATE   PROCEDURE dbo.PRC_COF_SAVE_COLLECTION
    @p_user_id INT,
    @p_analysis_id INT,
    @p_collection_name NVARCHAR(50),
    @p_personal_comment NVARCHAR(100),
    @p_collection_id INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @v_coffee_blend_id VARCHAR(20);
    DECLARE @v_existing_name INT;
    DECLARE @v_analysis_exists INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        SET @p_collection_id = NULL;

        IF @p_user_id IS NULL OR @p_user_id <= 0
        BEGIN
            SET @p_result_code = 'INVALID_USER';
            SET @p_result_message = N'유효하지 않은 사용자입니다.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        IF @p_analysis_id IS NULL OR @p_analysis_id <= 0
        BEGIN
            SET @p_result_code = 'INVALID_ANALYSIS';
            SET @p_result_message = N'유효하지 않은 분석 결과입니다.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        IF @p_collection_name IS NULL OR LEN(LTRIM(RTRIM(@p_collection_name))) = 0
        BEGIN
            SET @p_result_code = 'MISSING_NAME';
            SET @p_result_message = N'내 커피 이름을 입력해주세요.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        IF @p_personal_comment IS NULL OR LEN(LTRIM(RTRIM(@p_personal_comment))) = 0
        BEGIN
            SET @p_result_code = 'MISSING_COMMENT';
            SET @p_result_message = N'나만의 한줄 코멘트를 입력해주세요.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        -- 분석 결과 소유/존재 + blend id
        SELECT @v_analysis_exists = COUNT(*),
               @v_coffee_blend_id = MAX(coffee_blend_id)
        FROM dbo.TB_COF_TAST_ANLY
        WHERE analysis_id = @p_analysis_id
          AND user_id    = @p_user_id;

        IF @v_analysis_exists = 0
        BEGIN
            SET @p_result_code = 'ANALYSIS_NOT_FOUND';
            SET @p_result_message = N'분석 결과를 찾을 수 없거나 접근 권한이 없습니다.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        -- 동일 분석 결과 재저장 방지
        IF EXISTS (
            SELECT 1
            FROM dbo.TB_COF_MY_COLL
            WHERE user_id = @p_user_id
              AND analysis_id = @p_analysis_id
              AND deleted_at IS NULL
        )
        BEGIN
            SELECT TOP 1 @p_collection_id = collection_id
            FROM dbo.TB_COF_MY_COLL
            WHERE user_id = @p_user_id
              AND analysis_id = @p_analysis_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC;

            SET @p_result_code = 'ALREADY_SAVED';
            SET @p_result_message = N'이미 해당 분석 결과가 저장되어 있습니다.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        -- 같은 이름 중복(미삭제, 공백/대소문자 무시)
        SELECT @v_existing_name = COUNT(*)
        FROM dbo.TB_COF_MY_COLL
        WHERE user_id = @p_user_id
          AND UPPER(LTRIM(RTRIM(collection_name))) = UPPER(LTRIM(RTRIM(@p_collection_name)))
          AND deleted_at IS NULL;

        IF @v_existing_name > 0
        BEGIN
            SET @p_result_code = 'DUPLICATE_NAME';
            SET @p_result_message = N'이미 저장된 내 커피 이름입니다.';
            ROLLBACK TRANSACTION; RETURN;
        END;

        -- 저장(UTC)
        INSERT INTO dbo.TB_COF_MY_COLL(
            user_id, analysis_id, coffee_blend_id,
            collection_name, personal_comment, is_favorite,
            created_at, updated_at
        )
        VALUES(
            @p_user_id, @p_analysis_id, @v_coffee_blend_id,
            LTRIM(RTRIM(@p_collection_name)),
            LTRIM(RTRIM(@p_personal_comment)),
            0,
            SYSUTCDATETIME(), SYSUTCDATETIME()
        );

        SET @p_collection_id = SCOPE_IDENTITY();

        -- 결과 상태 갱신(UTC)
        UPDATE dbo.TB_COF_TAST_ANLY
        SET is_saved  = 1,
            expires_at = NULL,
            updated_at = SYSUTCDATETIME()
        WHERE analysis_id = @p_analysis_id;

        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'내 커피 컬렉션에 저장되었습니다.';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        SET @p_result_code = 'ERROR';
        SET @p_result_message = N'저장 중 오류가 발생했습니다: ' + ERROR_MESSAGE();
        SET @p_collection_id = NULL;

        INSERT INTO dbo.TB_COF_LOGS_LGIN(
            email_or_phone, masked_identifier, user_id, ip_address,
            login_method, success, failure_reason, attempted_at
        ) VALUES (
            'COLLECTION_SAVE_ERROR',
            'USER_' + CAST(@p_user_id AS VARCHAR(10)),
            @p_user_id,
            'SERVER',
            'SYSTEM',
            0,
            ERROR_MESSAGE(),
            SYSUTCDATETIME()
        );
    END CATCH
END;
go

