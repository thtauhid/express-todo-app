const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// Models
const { Todo } = require("./models");

// Middleware
app.use(bodyParser.json());

// Routes
// app.get('/todos', (req, res) => {});

app.post("/todos", async (req, res) => {
  try {
    const todo = await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
    });
    return res.json(todo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return res.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

// app.delete('/todos/:id', (req, res) => {});

module.exports = app;
