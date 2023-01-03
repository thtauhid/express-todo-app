const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("super secret"));
app.use(csrf("asdfertcndjkisnlihfcdndingfchsdd", ["POST", "PUT", "DELETE"]));

app.get("/", async function (request, response) {
  const overDue = await Todo.overDue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedItems();

  if (request.accepts("html")) {
    return response.render("index", {
      overDue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    return response.json({
      overDue,
      dueToday,
      dueLater,
      completedItems,
    });
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
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);

  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.send({ success: false });
  }
});

module.exports = app;
