const request = require("supertest");
const cherio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function getCsrfToken(html) {
  const $ = cherio.load(html);
  return $("input[name=_csrf]").val();
}

const login = async (agent, email, password) => {
  let res = await agent.get("/login");
  let csrfToken = getCsrfToken(res.text);
  return agent.post("/session").send({
    email,
    password,
    _csrf: csrfToken,
  });
};

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

  test("Sign Up", async () => {
    let res = await agent.get("/signup");
    let csrfToken = getCsrfToken(res.text);
    const response = await agent.post("/users").send({
      email: "abc@xyz.com",
      password: "password",
      firstName: "John",
      lastName: "Doe",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);

    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a new todo ", async () => {
    const agent = request.agent(server);
    await login(agent, "abc@xyz.com", "password");
    let res = await agent.get("/todos");
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
    const agent = request.agent(server);
    await login(agent, "abc@xyz.com", "password");
    let res = await agent.get("/todos");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    const latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
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

  // test("Fetches all todos", async () => {
  //   let res = await agent.get("/todos");
  //   let csrfToken = getCsrfToken(res.text);

  //   // Creating one todo
  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //     _csrf: csrfToken,
  //   });

  //   // Creating another todo
  //   res = await agent.get("/todos");
  //   csrfToken = getCsrfToken(res.text);
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //     _csrf: csrfToken,
  //   });

  //   const response = await agent
  //     .get("/todos")
  //     .set("Accept", "application/json");
  //   const parsedResponse = JSON.parse(response.text);
  //   console.log({ parsedResponse });
  //   expect(parsedResponse.length).toBe(4);
  //   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  // });

  test("Delete a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "abc@xyz.com", "password");

    let res = await agent.get("/todos");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    const latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = getCsrfToken(res.text);

    const deleteTodo = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const parsedDeletedTodo = JSON.parse(deleteTodo.text);
    expect(parsedDeletedTodo.success).toBe(true);
  });

  test("Marking an item as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "abc@xyz.com", "password");
    // Create a todo
    let res = await agent.get("/todos");
    let csrfToken = getCsrfToken(res.text);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    // Mark as complete
    let groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    let parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    let dueTodayCount = parsedGroupedTodosResponse.dueToday.length;
    let latestTodo = parsedGroupedTodosResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
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
      .get("/todos")
      .set("Accept", "application/json");
    parsedGroupedTodosResponse = JSON.parse(groupedTodosResponse.text);
    let completedTodoCount = parsedGroupedTodosResponse.completedItems.length;
    latestTodo =
      parsedGroupedTodosResponse.completedItems[completedTodoCount - 1];

    // Mark as incomplete
    res = await agent.get("/todos");
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
