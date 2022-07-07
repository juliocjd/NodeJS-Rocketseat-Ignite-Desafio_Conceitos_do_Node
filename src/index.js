const express = require('express');
const cors = require('cors');

const { v4: uuidV4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username === username)
  if (!user) {
    return response.status(404).json({ error: "Invalid User Name" })
  }
  request.user = user;
  return next();
}

function checksExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  const todos = user.todos.find(todos => todos.id === id)
  const todosIndex = user.todos.findIndex(todos => todos.id === id)
  if (!todos) {
    response.status(404).json({ error: `Todo of user ${user.username} not found` })
  } else {
    request.todos = todos;
    request.todosIndex = todosIndex;
    return next();
  }
}
app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const findUserName = users.find(user => user.username === username);
  if (findUserName != undefined) {
    return response.status(400).json({ error: "Already exists user" })
  }
  const User = {
    id: uuidV4(),
    name,
    username,
    todos: []
  }

  users.push(User)

  return response.status(201).json(User)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(201).json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;
  const todos = {
    id: uuidV4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(todos)
  return response.status(201).json(todos);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todos } = request;
  const { user } = request;
  const { deadline, title } = request.body;

  todos.title = title;
  todos.deadline = deadline;
  response.status(201).json(todos);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todos } = request;
  const { user } = request;
  todos.done = true;
  response.status(201).json(todos);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todosIndex } = request;
  const { user } = request;

  const todosDeleted = user.todos.splice(todosIndex, 1);

  response.status(204).send();
});

module.exports = app;