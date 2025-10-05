
----------------------------------------------------------
-- 3) (선택) 조회 헬퍼: 하트 색상(저장 여부) 확인용
----------------------------------------------------------
CREATE   PROCEDURE dbo.PRC_COF_GET_SAVE_STATUS
    @p_user_id INT,
    @p_analysis_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END AS is_saved,
        collection_id,
        collection_name,
        personal_comment
    FROM dbo.TB_COF_MY_COLL
    WHERE user_id = @p_user_id
      AND analysis_id = @p_analysis_id
    ORDER BY created_at DESC;
END;
go

