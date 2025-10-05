
CREATE PROCEDURE [dbo].[PRC_COF_GET_MONTHLY]
    @p_target_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @p_target_date IS NULL
        SET @p_target_date = GETDATE();
    
    SELECT 
        m.monthly_id,
        m.coffee_blend_id,
        b.coffee_name,
        b.summary,
        m.recommendation_title,
        m.recommendation_reason,
        m.curator_name,
        m.curator_title,
        p1.intensity_score AS aroma_score,
        p2.intensity_score AS acidity_score,
        p3.intensity_score AS nutty_score,
        p4.intensity_score AS body_score,
        p5.intensity_score AS sweetness_score
    FROM TB_COF_MNTH_PICK m  -- 올바른 테이블명 사용
    INNER JOIN TB_COF_COFF_BLND b ON m.coffee_blend_id = b.coffee_blend_id
    INNER JOIN TB_COF_COFF_PROF p1 ON b.coffee_blend_id = p1.coffee_blend_id AND p1.taste_attribute_id = 1
    INNER JOIN TB_COF_COFF_PROF p2 ON b.coffee_blend_id = p2.coffee_blend_id AND p2.taste_attribute_id = 2
    INNER JOIN TB_COF_COFF_PROF p3 ON b.coffee_blend_id = p3.coffee_blend_id AND p3.taste_attribute_id = 3
    INNER JOIN TB_COF_COFF_PROF p4 ON b.coffee_blend_id = p4.coffee_blend_id AND p4.taste_attribute_id = 4
    INNER JOIN TB_COF_COFF_PROF p5 ON b.coffee_blend_id = p5.coffee_blend_id AND p5.taste_attribute_id = 5
    WHERE @p_target_date BETWEEN m.display_start_date AND m.display_end_date
        AND m.is_active = 1;
END;
go

