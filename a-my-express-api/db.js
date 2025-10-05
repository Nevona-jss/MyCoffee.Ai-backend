const sql = require("mssql");

const dbConfig = {
  user: "sadb",
  password: "jss0905!!",
  server: "db.jsdevdemo.com",   // 문자열!
  database: "COF",
  port : 7400,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise;

async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        console.log("✅ DB Connected");
        return pool;
      })
      .catch((err) => {
        console.error("❌ DB Connection Failed:", err);
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { getPool, sql };
