
CREATE PROCEDURE [dbo].[PRC_COF_GET_AI_STORY]
    @p_coffee_blend_id VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        story_type,
        CASE story_type
            WHEN 'BREWING_TIP' THEN N'이렇게 즐겨보세요'
            WHEN 'FOOD_PAIRING' THEN N'함께하면 좋은 순간'
            WHEN 'MUSIC_MATCH' THEN N'오늘은 이런 음악과'
            WHEN 'MOVIE_MATCH' THEN N'영화와 함께라면'
        END AS story_title,
        story_content,
        display_order
    FROM TB_COF_AI_STRY  -- 올바른 테이블명 사용
    WHERE coffee_blend_id = @p_coffee_blend_id
        AND is_active = 1
    ORDER BY display_order ASC;
END;
go

