require("dotenv").config();

module.exports = {
  development: {
    username: "postgres",
    password: "postgres",
    database: "wd-todo-dev",
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
