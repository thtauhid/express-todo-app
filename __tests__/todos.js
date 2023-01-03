const request = require("supertest");
const cherio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function getCsrfToken(html) {
  const $ = cherio.load(html);
  return $("input[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3009, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a new todo ", async () => {
    let res = await agent.get("/");
    let csrfToken = getCsrfToken(res.text);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    const latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = getCsrfToken(res.text);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });
    const updatedParsedResponse = JSON.parse(markCompleteResponse.text);
    expect(updatedParsedResponse.completed).toBe(true);
  });

  test("Fetches all todos", async () => {
    let res = await agent.get("/");
    let csrfToken = getCsrfToken(res.text);

    // Creating one todo
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    // Creating another todo
    res = await agent.get("/");
    csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });

  test("Delete a todo", async () => {
    let res = await agent.get("/");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    const latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = getCsrfToken(res.text);

    const deleteTodo = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const parsedDeletedTodo = JSON.parse(deleteTodo.text);
    expect(parsedDeletedTodo.success).toBe(true);
  });
  test("Marking an item as incomplete", async () => {
    // Create a todo
    let res = await agent.get("/");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    // Mark as complete
    let groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    let parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    let dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    let latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = getCsrfToken(res.text);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });

    // Check if it is marked as complete
    let updatedParsedResponse = JSON.parse(markCompleteResponse.text);
    expect(updatedParsedResponse.completed).toBe(true);

    // Get the item from completedItems array
    groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    let completedTodoCount = parsedGroupedTodosResponse.completedItems.length;
    latestTodo =
      parsedGroupedTodosResponse.completedItems[completedTodoCount - 1];

    // Mark as incomplete
    res = await agent.get("/");
    csrfToken = getCsrfToken(res.text);

    const markIncompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });

    // Check if marked as incomplete
    updatedParsedResponse = JSON.parse(markIncompleteResponse.text);
    expect(updatedParsedResponse.completed).toBe(false);
  });
});
