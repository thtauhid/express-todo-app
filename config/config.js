require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: "127.0.0.1",
    port: 5433,
    dialect: "postgres",
  },
  test: {
    username: "postgres",
    password: "postgres",
    database: "wd-todo-test",
    host: "127.0.0.1",
    port: 5433,
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
  },
};
