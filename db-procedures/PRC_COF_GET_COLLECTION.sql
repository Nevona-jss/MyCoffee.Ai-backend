
CREATE PROCEDURE [dbo].[PRC_COF_GET_COLLECTION]
    @p_user_id INT,
    @p_collection_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.collection_id,
        c.collection_name,
        c.personal_comment,
        c.coffee_blend_id,
        b.coffee_name,
        b.summary,
        c.created_at,
        c.updated_at,
        a.aroma_score,
        a.acidity_score,
        a.nutty_score,
        a.body_score,
        a.sweetness_score,
        a.match_percentage,
        -- 원산지 구성 정보
        STUFF((
            SELECT ', ' + o.origin_name + ' ' + CAST(comp.percentage AS VARCHAR(10)) + '%'
            FROM TB_COF_COFF_COMP comp
            INNER JOIN TB_COF_COFF_ORGN o ON comp.coffee_origin_id = o.coffee_origin_id
            WHERE comp.coffee_blend_id = b.coffee_blend_id
            ORDER BY comp.percentage DESC
            FOR XML PATH('')
        ), 1, 2, '') AS origin_composition
    FROM TB_COF_MY_COLL c  -- 올바른 테이블명 사용
    INNER JOIN TB_COF_COFF_BLND b ON c.coffee_blend_id = b.coffee_blend_id
    LEFT JOIN TB_COF_TAST_ANLY a ON c.analysis_id = a.analysis_id  -- 올바른 테이블명 사용
    WHERE c.user_id = @p_user_id
        AND c.deleted_at IS NULL
        AND (@p_collection_id IS NULL OR c.collection_id = @p_collection_id)
    ORDER BY c.created_at DESC;
END;
go

