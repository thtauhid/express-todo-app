const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  const allTodos = await Todo.getTodos();
  const overDue = await Todo.overDue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();

  if (request.accepts("html")) {
    return response.render("index", { allTodos, overDue, dueToday, dueLater });
  } else {
    return response.json(allTodos);
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");

  const todos = await Todo.getTodos();
  return response.json(todos);
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);

  const todo = await Todo.findByPk(request.params.id);

  try {
    await todo.delete();
    return response.send(true);
  } catch (error) {
    return response.send(false);
  }
});

module.exports = app;
