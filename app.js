const express = require("express");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const localStrategy = require("passport-local");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("super secret"));
app.use(csrf("asdfertcndjkisnlihfcdndingfchsdd", ["POST", "PUT", "DELETE"]));
app.use(
  session({
    secret: "knbnfdfvjnfk00ww",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new localStrategy(
    { usernameField: "email", passwordField: "password" },
    async (username, password, done) => {
      await User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          if (user) {
            const result = await bcrypt.compare(password, user.password);
            if (result) return done(null, user);
          }
          return done(null, false, { message: "Invalid Credentials" });
        })
        .catch((err) => {
          console.log({ err });
          return err;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user: ", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  await User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", async function (request, response) {
  response.render("index", {
    title: "Todo App",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const userId = request.user.id;

    const overDue = await Todo.overDue(userId);
    const dueToday = await Todo.dueToday(userId);
    const dueLater = await Todo.dueLater(userId);
    const completedItems = await Todo.completedItems(userId);

    if (request.accepts("html")) {
      return response.render("todos", {
        overDue,
        dueToday,
        dueLater,
        completedItems,
        title: "Todo App",
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
  }
);

app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      // Send flash
      request.flash("error", error.message);
      return response.redirect("/todos");
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);

    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      return response.send({ success: false });
    }
  }
);

app.get("/signup", async function (request, response) {
  response.render("signup", {
    title: "Sign up",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async function (request, response) {
  try {
    const { firstName, lastName, email, password } = request.body;
    console.log({
      firstName,
      lastName,
      email,
      password,
    });
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log({ hashedPassword });
    // Create a user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    request.login(user, (err) => {
      if (err) console.log(err);
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    // Send flash
    request.flash("error", error.message);
    response.redirect("/signup");
  }
});

app.get("/login", async function (request, response) {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async function (request, response) {
    console.log("User: ", request.user);
    response.redirect("/todos");
  }
);

app.get("/signout", async function (request, response, next) {
  request.logout((err) => {
    if (err) return next(err);
    response.redirect("/");
  });
});

module.exports = app;
