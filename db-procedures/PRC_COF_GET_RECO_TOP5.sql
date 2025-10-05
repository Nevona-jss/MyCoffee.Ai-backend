
CREATE PROCEDURE dbo.PRC_COF_GET_RECO_TOP5
(
    @p_user_aroma      INT,
    @p_user_acidity    INT,
    @p_user_nutty      INT,
    @p_user_body       INT,
    @p_user_sweetness  INT,
    @p_limit_similar   INT = 4,
    @p_result_code     VARCHAR(50)  OUTPUT,
    @p_result_message  NVARCHAR(255) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 입력 검증(0~5)
        IF (@p_user_aroma     NOT BETWEEN 0 AND 5) OR
           (@p_user_acidity   NOT BETWEEN 0 AND 5) OR
           (@p_user_nutty     NOT BETWEEN 0 AND 5) OR
           (@p_user_body      NOT BETWEEN 0 AND 5) OR
           (@p_user_sweetness NOT BETWEEN 0 AND 5)
        BEGIN
            SET @p_result_code = 'INVALID_RANGE';
            SET @p_result_message = N'입력 점수는 0~5 범위여야 합니다.';
            RETURN;
        END;

        /* 1) 거리 계산 원본(#DIST) */
        IF OBJECT_ID('tempdb..#DIST') IS NOT NULL DROP TABLE #DIST;

        SELECT
            b.coffee_blend_id,
            b.coffee_name,
            p1.intensity_score AS aroma_score,
            p2.intensity_score AS acidity_score,
            p3.intensity_score AS nutty_score,
            p4.intensity_score AS body_score,
            p5.intensity_score AS sweetness_score,
            (ABS(p1.intensity_score - @p_user_aroma)
           + ABS(p2.intensity_score - @p_user_acidity)
           + ABS(p3.intensity_score - @p_user_nutty)
           + ABS(p4.intensity_score - @p_user_body)
           + ABS(p5.intensity_score - @p_user_sweetness)) AS taste_distance
        INTO #DIST
        FROM dbo.TB_COF_COFF_BLND AS b WITH (NOLOCK)
        INNER JOIN dbo.TB_COF_COFF_PROF AS p1 ON b.coffee_blend_id = p1.coffee_blend_id AND p1.taste_attribute_id = 1
        INNER JOIN dbo.TB_COF_COFF_PROF AS p2 ON b.coffee_blend_id = p2.coffee_blend_id AND p2.taste_attribute_id = 2
        INNER JOIN dbo.TB_COF_COFF_PROF AS p3 ON b.coffee_blend_id = p3.coffee_blend_id AND p3.taste_attribute_id = 3
        INNER JOIN dbo.TB_COF_COFF_PROF AS p4 ON b.coffee_blend_id = p4.coffee_blend_id AND p4.taste_attribute_id = 4
        INNER JOIN dbo.TB_COF_COFF_PROF AS p5 ON b.coffee_blend_id = p5.coffee_blend_id AND p5.taste_attribute_id = 5;

        /* 2) 결과 컨테이너(#_top5): 넉넉한 스키마 */
        IF OBJECT_ID('tempdb..#_top5') IS NOT NULL DROP TABLE #_top5;
        CREATE TABLE #_top5
        (
            rank_no           INT            NOT NULL,
            group_type        VARCHAR(16)    NOT NULL,          -- 'BEST' | 'SIMILAR'
            coffee_blend_id   NVARCHAR(256)  NOT NULL,          -- 넉넉히
            coffee_name       NVARCHAR(1024) NULL,              -- 넉넉히
            similarity_score  DECIMAL(38,20) NULL,              -- 충분한 정밀도
            taste_distance    INT            NULL,
            aroma_score       INT            NULL,
            acidity_score     INT            NULL,
            nutty_score       INT            NULL,
            body_score        INT            NULL,
            sweetness_score   INT            NULL
        );

        /* 3) BEST 1개 적재 */
        INSERT #_top5 (rank_no, group_type, coffee_blend_id, coffee_name,
                       similarity_score, taste_distance,
                       aroma_score, acidity_score, nutty_score, body_score, sweetness_score)
        SELECT TOP (1)
               1,
               'BEST',
               CAST(d.coffee_blend_id AS NVARCHAR(256)),
               CAST(d.coffee_name     AS NVARCHAR(1024)),
               CAST(NULL              AS DECIMAL(38,20)),
               CAST(d.taste_distance  AS INT),
               CAST(d.aroma_score     AS INT),
               CAST(d.acidity_score   AS INT),
               CAST(d.nutty_score     AS INT),
               CAST(d.body_score      AS INT),
               CAST(d.sweetness_score AS INT)
        FROM #DIST AS d
        ORDER BY d.taste_distance ASC, d.coffee_blend_id ASC;

        DECLARE @v_best_id NVARCHAR(256) = (SELECT TOP(1) coffee_blend_id FROM #_top5);

        /* 4) SIMILAR — 유사도 테이블 우선 */
        IF OBJECT_ID(N'dbo.TB_COF_SIML_RCMD', N'U') IS NOT NULL
        BEGIN
            INSERT #_top5 (rank_no, group_type, coffee_blend_id, coffee_name,
                           similarity_score, taste_distance,
                           aroma_score, acidity_score, nutty_score, body_score, sweetness_score)
            SELECT TOP (@p_limit_similar)
                   ROW_NUMBER() OVER (ORDER BY s.similarity_score DESC, s.rank_order ASC) + 1,
                   'SIMILAR',
                   CAST(b2.coffee_blend_id AS NVARCHAR(256)),
                   CAST(b2.coffee_name     AS NVARCHAR(1024)),
                   CAST(s.similarity_score AS DECIMAL(38,20)),
                   CAST(NULL               AS INT),
                   CAST(d2.aroma_score     AS INT),
                   CAST(d2.acidity_score   AS INT),
                   CAST(d2.nutty_score     AS INT),
                   CAST(d2.body_score      AS INT),
                   CAST(d2.sweetness_score AS INT)
            FROM dbo.TB_COF_SIML_RCMD AS s WITH (NOLOCK)
            INNER JOIN dbo.TB_COF_COFF_BLND AS b2 ON b2.coffee_blend_id = s.similar_coffee_id
            INNER JOIN #DIST AS d2 ON d2.coffee_blend_id = b2.coffee_blend_id
            WHERE s.base_coffee_id = @v_best_id
              AND s.similar_coffee_id <> @v_best_id;
        END

        /* 5) 부족분은 거리기반 보충(중복 제외) */
        DECLARE @remain INT = @p_limit_similar - (SELECT COUNT(*) FROM #_top5 WHERE group_type='SIMILAR');
        IF @remain > 0
        BEGIN
            INSERT #_top5 (rank_no, group_type, coffee_blend_id, coffee_name,
                           similarity_score, taste_distance,
                           aroma_score, acidity_score, nutty_score, body_score, sweetness_score)
            SELECT TOP (@remain)
                   (SELECT ISNULL(MAX(rank_no),1) FROM #_top5) + ROW_NUMBER() OVER (ORDER BY d.taste_distance ASC, d.coffee_blend_id ASC),
                   'SIMILAR',
                   CAST(d.coffee_blend_id AS NVARCHAR(256)),
                   CAST(d.coffee_name     AS NVARCHAR(1024)),
                   CAST(NULL              AS DECIMAL(38,20)),
                   CAST(d.taste_distance  AS INT),
                   CAST(d.aroma_score     AS INT),
                   CAST(d.acidity_score   AS INT),
                   CAST(d.nutty_score     AS INT),
                   CAST(d.body_score      AS INT),
                   CAST(d.sweetness_score AS INT)
            FROM #DIST AS d
            WHERE d.coffee_blend_id NOT IN (SELECT coffee_blend_id FROM #_top5)
            ORDER BY d.taste_distance ASC, d.coffee_blend_id ASC;
        END

        /* 6) 반환 */
        SELECT *
        FROM #_top5
        ORDER BY rank_no;

        SET @p_result_code = 'OK';
        SET @p_result_message = N'BEST 1 + SIMILAR 4 구성 완료';
    END TRY
    BEGIN CATCH
        SET @p_result_code = 'ERROR';
        SET @p_result_message = LEFT(ERROR_MESSAGE(), 255);
        ;THROW;
    END CATCH
END
go

