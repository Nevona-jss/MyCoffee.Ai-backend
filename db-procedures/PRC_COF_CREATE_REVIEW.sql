-- =============================================
-- 리뷰 작성 프로시저
-- 화면: [13-04]리뷰_작성하기
-- =============================================
CREATE PROCEDURE [dbo].[PRC_COF_CREATE_REVIEW]
    @p_user_id INT,
    @p_order_id INT,
    @p_order_item_id INT,
    @p_star_rating INT,
    @p_review_content NVARCHAR(300),
    @p_image_urls NVARCHAR(MAX) = NULL, -- JSON 배열 형태: ["url1","url2","url3"]
    
    -- 출력 매개변수
    @p_review_id INT OUTPUT,
    @p_result_code VARCHAR(50) OUTPUT,
    @p_result_message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_coffee_blend_id VARCHAR(20);
    DECLARE @v_collection_id INT;
    DECLARE @v_point_amount INT = 0;
    DECLARE @v_has_photo BIT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 초기화
        SET @p_review_id = NULL;
        
        -- 입력값 검증
        IF @p_star_rating < 1 OR @p_star_rating > 5
        BEGIN
            SET @p_result_code = 'INVALID_RATING';
            SET @p_result_message = N'별점은 1~5점 사이로 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF LEN(LTRIM(RTRIM(@p_review_content))) < 1 OR LEN(LTRIM(RTRIM(@p_review_content))) > 300
        BEGIN
            SET @p_result_code = 'INVALID_CONTENT';
            SET @p_result_message = N'리뷰 내용은 1~300자 사이로 입력해주세요.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 주문 아이템 정보 조회
        SELECT 
            @v_coffee_blend_id = oi.coffee_blend_id
        FROM TB_COF_ORDR_ITEM oi
        INNER JOIN TB_COF_ORDR_MAIN om ON oi.order_id = om.order_id
        WHERE oi.order_item_id = @p_order_item_id
            AND om.user_id = @p_user_id
            AND om.order_status = 'DELIVERED';
        
        IF @v_coffee_blend_id IS NULL
        BEGIN
            SET @p_result_code = 'INVALID_ORDER';
            SET @p_result_message = N'리뷰를 작성할 수 없는 주문입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 중복 리뷰 확인
        IF EXISTS (
            SELECT 1 FROM TB_COF_REVI_MAIN 
            WHERE order_item_id = @p_order_item_id 
                AND deleted_at IS NULL
        )
        BEGIN
            SET @p_result_code = 'DUPLICATE_REVIEW';
            SET @p_result_message = N'이미 리뷰를 작성한 상품입니다.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 포토 여부 확인 및 포인트 계산
        IF @p_image_urls IS NOT NULL AND LEN(@p_image_urls) > 2
        BEGIN
            SET @v_has_photo = 1;
            SET @v_point_amount = 1000; -- 포토리뷰 포인트
        END
        
        -- 컬렉션 ID 조회 (있는 경우)
        SELECT TOP 1 @v_collection_id = collection_id
        FROM TB_COF_MY_COLL
        WHERE user_id = @p_user_id
            AND coffee_blend_id = @v_coffee_blend_id
            AND deleted_at IS NULL
        ORDER BY created_at DESC;
        
        -- 리뷰 저장
        INSERT INTO TB_COF_REVI_MAIN (
            user_id, order_id, order_item_id, coffee_blend_id, collection_id,
            star_rating, review_content, like_count, view_count,
            point_status, point_amount, has_photo, is_visible,
            created_at, updated_at
        ) VALUES (
            @p_user_id, @p_order_id, @p_order_item_id, @v_coffee_blend_id, @v_collection_id,
            @p_star_rating, LTRIM(RTRIM(@p_review_content)), 0, 0,
            'PENDING', @v_point_amount, @v_has_photo, 1,
            GETDATE(), GETDATE()
        );
        
        SET @p_review_id = SCOPE_IDENTITY();
        
        -- 이미지 저장 (JSON 파싱 필요)
        -- 실제 구현 시 OPENJSON 사용 또는 애플리케이션에서 개별 호출
        
        -- 주문 아이템의 리뷰 작성 플래그 업데이트
        UPDATE TB_COF_ORDR_ITEM
        SET has_review = 1,
            updated_at = GETDATE()
        WHERE order_item_id = @p_order_item_id;
        
        SET @p_result_code = 'SUCCESS';
        SET @p_result_message = N'리뷰가 등록되었습니다. 포인트는 48시간 이내 지급됩니다.';
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result_code = 'ERROR';
        SET @p_result_message = ERROR_MESSAGE();
        SET @p_review_id = NULL;
    END CATCH
END;
go

