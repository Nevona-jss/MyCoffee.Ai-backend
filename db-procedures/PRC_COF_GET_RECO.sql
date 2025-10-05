
-- =============================================
-- 1. 기존 PRC_COF_GET_RECO 프로시저 수정
-- 분석 저장 기능 추가
-- =============================================
CREATE PROCEDURE  [dbo].[PRC_COF_GET_RECO]
    @p_user_aroma INT,
    @p_user_acidity INT,
    @p_user_nutty INT,
    @p_user_body INT,
    @p_user_sweetness INT,
    @p_user_id INT = NULL,
    @p_save_analysis BIT = 0,  -- 새로 추가: 분석 저장 여부
    
    -- 출력 매개변수
    @p_analysis_id INT = NULL OUTPUT,  -- 새로 추가
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- 초기화
        SET @p_result_code = NULL;
        SET @p_result_message = NULL;
        SET @p_analysis_id = NULL;
        
        -- =============================================
        -- 1. 입력값 유효성 검증 (기존 로직 유지)
        -- =============================================
        IF @p_user_aroma IS NULL OR @p_user_aroma < 0 OR @p_user_aroma > 5
        BEGIN
            SET @p_result_code = 'INVALID_AROMA';
            SET @p_result_message = N'향 선호도는 0~5점 사이로 입력해주세요.';
            RETURN;
        END
        
        IF @p_user_acidity IS NULL OR @p_user_acidity < 0 OR @p_user_acidity > 5
        BEGIN
            SET @p_result_code = 'INVALID_ACIDITY';
            SET @p_result_message = N'산미 선호도는 0~5점 사이로 입력해주세요.';
            RETURN;
        END
        
        IF @p_user_nutty IS NULL OR @p_user_nutty < 0 OR @p_user_nutty > 5
        BEGIN
            SET @p_result_code = 'INVALID_NUTTY';
            SET @p_result_message = N'고소함 선호도는 0~5점 사이로 입력해주세요.';
            RETURN;
        END
        
        IF @p_user_body IS NULL OR @p_user_body < 0 OR @p_user_body > 5
        BEGIN
            SET @p_result_code = 'INVALID_BODY';
            SET @p_result_message = N'바디감 선호도는 0~5점 사이로 입력해주세요.';
            RETURN;
        END
        
        IF @p_user_sweetness IS NULL OR @p_user_sweetness < 0 OR @p_user_sweetness > 5
        BEGIN
            SET @p_result_code = 'INVALID_SWEETNESS';
            SET @p_result_message = N'단맛 선호도는 0~5점 사이로 입력해주세요.';
            RETURN;
        END
        
        -- =============================================
        -- 2. 커피 데이터 존재 여부 확인 (기존 로직)
        -- =============================================
        IF NOT EXISTS (SELECT 1 FROM TB_COF_COFF_BLND)
        BEGIN
            SET @p_result_code = 'NO_COFFEE_DATA';
            SET @p_result_message = N'추천할 커피 데이터가 없습니다.';
            RETURN;
        END
        
        -- =============================================
        -- 3. 분석 결과 저장 (신규 기능)
        -- =============================================
        IF @p_save_analysis = 1 AND @p_user_id IS NOT NULL
        BEGIN
            BEGIN TRANSACTION;
            
            DECLARE @v_top_coffee_id VARCHAR(20);
            DECLARE @v_match_percentage INT;
            
            -- 최고 매칭 커피 찾기
            SELECT TOP 1
                @v_top_coffee_id = coffee_blend_id,
                @v_match_percentage = match_percentage
            FROM (
                SELECT 
                    b.coffee_blend_id,
                    CAST(
                        100 - (SQRT(
                            POWER(@p_user_aroma - p1.intensity_score, 2) +
                            POWER(@p_user_acidity - p2.intensity_score, 2) +
                            POWER(@p_user_nutty - p3.intensity_score, 2) +
                            POWER(@p_user_body - p4.intensity_score, 2) +
                            POWER(@p_user_sweetness - p5.intensity_score, 2)
                        ) / SQRT(125) * 100)
                        AS INT
                    ) AS match_percentage
                FROM TB_COF_COFF_BLND b
                INNER JOIN TB_COF_COFF_PROF p1 ON b.coffee_blend_id = p1.coffee_blend_id AND p1.taste_attribute_id = 1
                INNER JOIN TB_COF_COFF_PROF p2 ON b.coffee_blend_id = p2.coffee_blend_id AND p2.taste_attribute_id = 2
                INNER JOIN TB_COF_COFF_PROF p3 ON b.coffee_blend_id = p3.coffee_blend_id AND p3.taste_attribute_id = 3
                INNER JOIN TB_COF_COFF_PROF p4 ON b.coffee_blend_id = p4.coffee_blend_id AND p4.taste_attribute_id = 4
                INNER JOIN TB_COF_COFF_PROF p5 ON b.coffee_blend_id = p5.coffee_blend_id AND p5.taste_attribute_id = 5
            ) AS RankedCoffees
            ORDER BY match_percentage DESC;
            
            -- TB_COF_TAST_ANLY에 저장
            INSERT INTO TB_COF_TAST_ANLY (
                user_id, coffee_blend_id, analysis_type,
                aroma_score, acidity_score, nutty_score,
                body_score, sweetness_score, match_percentage,
                is_saved, expires_at, created_at, updated_at
            ) VALUES (
                @p_user_id, @v_top_coffee_id, 'USER_INPUT',
                @p_user_aroma, @p_user_acidity, @p_user_nutty,
                @p_user_body, @p_user_sweetness, @v_match_percentage,
                0, DATEADD(HOUR, 24, GETDATE()),
                GETDATE(), GETDATE()
            );
            
            SET @p_analysis_id = SCOPE_IDENTITY();
            
            COMMIT TRANSACTION;
        END
        
        -- =============================================
        -- 4. 유클리드 거리 기반 커피 추천 (기존 로직 유지)
        -- =============================================
        SELECT TOP 5
            b.coffee_blend_id,
            b.coffee_name,
            b.summary,
            SQRT(
                POWER(@p_user_aroma - p1.intensity_score, 2) +
                POWER(@p_user_acidity - p2.intensity_score, 2) +
                POWER(@p_user_nutty - p3.intensity_score, 2) +
                POWER(@p_user_body - p4.intensity_score, 2) +
                POWER(@p_user_sweetness - p5.intensity_score, 2)
            ) AS distance_score,
            p1.intensity_score AS aroma_score,
            p2.intensity_score AS acidity_score,
            p3.intensity_score AS nutty_score,
            p4.intensity_score AS body_score,
            p5.intensity_score AS sweetness_score,
            CAST(
                100 - (SQRT(
                    POWER(@p_user_aroma - p1.intensity_score, 2) +
                    POWER(@p_user_acidity - p2.intensity_score, 2) +
                    POWER(@p_user_nutty - p3.intensity_score, 2) +
                    POWER(@p_user_body - p4.intensity_score, 2) +
                    POWER(@p_user_sweetness - p5.intensity_score, 2)
                ) / SQRT(125) * 100)
                AS INT
            ) AS match_percentage
        FROM TB_COF_COFF_BLND b
        INNER JOIN TB_COF_COFF_PROF p1 ON b.coffee_blend_id = p1.coffee_blend_id AND p1.taste_attribute_id = 1
        INNER JOIN TB_COF_COFF_PROF p2 ON b.coffee_blend_id = p2.coffee_blend_id AND p2.taste_attribute_id = 2
        INNER JOIN TB_COF_COFF_PROF p3 ON b.coffee_blend_id = p3.coffee_blend_id AND p3.taste_attribute_id = 3
        INNER JOIN TB_COF_COFF_PROF p4 ON b.coffee_blend_id = p4.coffee_blend_id AND p4.taste_attribute_id = 4
        INNER JOIN TB_COF_COFF_PROF p5 ON b.coffee_blend_id = p5.coffee_blend_id AND p5.taste_attribute_id = 5
        ORDER BY distance_score ASC;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'커피 추천이 완료되었습니다.';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SET @p_result_code = 'ERROR';
        SET @p_result_message = N'커피 추천 중 오류가 발생했습니다: ' + ERROR_MESSAGE();
    END CATCH
END;
go

