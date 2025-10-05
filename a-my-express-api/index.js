// index.js
const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// ──────────────────────────────────────────────────────────────
// DB 풀 캐싱 (기존 동작 유지)
let poolPromise;
async function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER,
      options: { encrypt: true, trustServerCertificate: true },
    });
    poolPromise = pool.connect();
  }
  return poolPromise;
}

// ──────────────────────────────────────────────────────────────
// Swagger 설정 (기존 유지 + tags)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "MyCoffee.AI API", version: "1.0.0" },
    tags: [
      { name: "Coffee Recommendation", description: "커피 취향 분석 및 추천" },
      { name: "Coffee Analysis", description: "지난 분석/만료 등" },
      { name: "Coffee Collection", description: "내 커피 컬렉션" },
      { name: "Auth", description: "회원/로그인/비밀번호 재설정" },
      { name: "Phone", description: "휴대폰 인증" },
    ],
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
// ──────────────────────────────────────────────────────────────

const app = express();
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ──────────────────────────────────────────────────────────────
// 공통: 라우터 안전 마운트 유틸 (호환성 보장)
// - CJS 기본 export(함수) 또는 {router} 또는 {default} 모두 허용
// - 모듈 해석 실패 시 상세 로그와 함께 가드
function resolveRouter(mod) {
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.router === "function") return mod.router;
  if (mod && typeof mod.default === "function") return mod.default;
  return null;
}
function safeMount(basePath, modulePath) {
  const mod = require(modulePath); // 경로에 .js 확장자까지 쓰는 것을 권장
  const router = resolveRouter(mod);
  if (!router) {
    console.error(`[safeMount] ${modulePath} typeof:`, typeof mod, "keys:", Object.keys(mod || {}));
    throw new Error("라우터 export 형식 오류: 함수가 아님");
  }
  app.use(basePath, router);
}

// ──────────────────────────────────────────────────────────────
// 기존 라우트 마운트들(원본 유지)
safeMount("/collections", "./routes/collections.get.js");
safeMount("/collections", "./routes/collections.update.js");
safeMount("/collections", "./routes/collections.delete.js");

// 취향 분석 / 추천
safeMount("/reco", "./routes/reco.js");
// Top5 (신규 라우트는 별도 파일로 관리)
safeMount("/reco/top5", "./routes/reco.top5.js");

// 지난 분석(24시간 유효) — ✅ 이번 추가 라인
safeMount("/analyses/past", "./routes/analyses.past.js");

safeMount("/collections", "./routes/collections.js");

safeMount("/signup", "./routes/signup.js");

// 이메일 로그인: 내부 경로가 '/email/login' 절대경로 → basePath는 '/'
safeMount("/", "./routes/emailLogin.js");

// 비밀번호 재설정 계열
safeMount("/", "./routes/resetPassword.js");
safeMount("/", "./routes/resetVerify.js");
safeMount("/", "./routes/setNewPassWord.js");

safeMount("/collections", "./routes/collections.saveStatus.js"); // GET /collections/save-status


// ⬆⬆⬆ [추가] 끝 ⬆⬆⬆
// ──────────────────────────────────────────────────────────────

// 서버 실행
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// 기존과 동일하게 getPool export 유지
module.exports = { getPool };
