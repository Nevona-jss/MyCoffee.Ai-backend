CREATE FUNCTION dbo.FN_COF_MASK_PHON(@phone VARCHAR(20))
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @result VARCHAR(20);
    DECLARE @cleanPhone VARCHAR(20);
    
    -- 하이픈 제거
    SET @cleanPhone = REPLACE(@phone, '-', '');
    
    -- 휴대폰 번호 길이에 따른 마스킹 처리
    IF LEN(@cleanPhone) = 11
    BEGIN
        SET @result = LEFT(@cleanPhone, 3) + '****' + RIGHT(@cleanPhone, 4);
    END
    ELSE IF LEN(@cleanPhone) = 10
    BEGIN
        SET @result = LEFT(@cleanPhone, 3) + '***' + RIGHT(@cleanPhone, 4);
    END
    ELSE
    BEGIN
        SET @result = @phone; -- 원본 반환
    END
    
    RETURN @result;
END;
go

