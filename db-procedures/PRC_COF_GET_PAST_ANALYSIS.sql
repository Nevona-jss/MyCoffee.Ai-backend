
CREATE PROCEDURE [dbo].[PRC_COF_GET_PAST_ANALYSIS]
    @p_user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.analysis_id,
        a.coffee_blend_id,
        b.coffee_name,
        b.summary,
        a.created_at,
        a.is_saved,
        CASE 
            WHEN a.expires_at IS NULL THEN NULL
            ELSE DATEDIFF(HOUR, GETDATE(), a.expires_at)
        END AS hours_remaining,
        a.aroma_score,
        a.acidity_score,
        a.nutty_score,
        a.body_score,
        a.sweetness_score,
        a.match_percentage
    FROM TB_COF_TAST_ANLY a  -- 올바른 테이블명 사용
    INNER JOIN TB_COF_COFF_BLND b ON a.coffee_blend_id = b.coffee_blend_id
    WHERE a.user_id = @p_user_id
        AND (a.expires_at IS NULL OR a.expires_at > GETDATE())
    ORDER BY a.created_at DESC;
END;
go

