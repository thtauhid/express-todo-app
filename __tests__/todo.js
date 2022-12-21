const request = require("supertest");
const db = require("../models/index");
const app = require("../app");

let server, agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("should respond with json at /todos", async () => {
    // Creating an item
    const response = await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });

    expect(response.statusCode).toBe(200);
    expect(response.header["content-type"]).toBe(
      "application/json; charset=utf-8"
    );
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });

  test("Mark as completed", async () => {
    // Creating an item
    const response = await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });

    const parsedResponse = JSON.parse(response.text);
    const todoId = parsedResponse.id;

    // Checking before marking as complete
    expect(parsedResponse.completed).toBe(false);

    // Mark it as complete
    const markAsComplete = await agent
      .put(`/todos/${todoId}/markAsCompleted`)
      .send();
    const parseUpdatedResponse = JSON.parse(markAsComplete.text);

    // Checking after marking as complete
    expect(parseUpdatedResponse.completed).toBe(true);
  });
});
