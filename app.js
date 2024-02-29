const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

let db = null

const dbPath = path.join(__dirname, 'todoApplication.db')
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1 GET METHOD:
const hasPriorityAndStatusKey = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityKey = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusKey = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  const requestQuery = request.query
  const {search_q = '', priority, status} = requestQuery
  let ToDoQuery = null
  let getToDoQuery = ''

  switch (true) {
    // SCENARIO 3:
    case hasPriorityAndStatusKey(requestQuery):
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    todo LIKE '%${search_q}%' AND
    priority LIKE '%${priority}%' AND  
    status LIKE '%${status}%';`
      break

    // SCENARIO 1:
    case hasStatusKey(requestQuery):
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    todo LIKE '%${search_q}%' AND
    status LIKE '%${status}%';`
      break

    // SCENARIO 2:
    case hasPriorityKey(requestQuery):
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    todo LIKE '%${search_q}%' AND
    priority LIKE '%${priority}%';`
      break

    // SCENARIO 4:
    default:
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    todo LIKE '%${search_q}%';`
  }

  ToDoQuery = await db.all(getToDoQuery)
  response.send(ToDoQuery)
})

// API 2 GET METHOD:
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getIdQuery = `
    SELECT * 
    FROM todo
    WHERE 
    id = ${todoId};`

  const getId = await db.get(getIdQuery)
  response.send(getId)
})

// API 3 POST METHOD:
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const addTodoQuery = `
  INSERT INTO todo (id, todo, priority, status)
  VALUES(
  ${id},
  '${todo}',
  '${priority}',
  '${status}'
  );`

  const addTodo = await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//API 4 PUT METHOD:
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const previousTodoQuery = `
  SELECT * 
  FROM todo
  WHERE
  id = ${todoId}`

  const previousTodo = await db.get(previousTodoQuery)
  //console.log(previousTodo)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const requestBody = request.body
  //console.log(priority)
  let updateResponse = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateResponse = 'Status'
      break
    case requestBody.priority !== undefined:
      updateResponse = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateResponse = 'Todo'
      break
  }

  const updatedTodoQuery = `
  UPDATE 
  todo
  SET
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE 
  id = ${todoId}`

  const updatedTodo = db.run(updatedTodoQuery)
  response.send(`${updateResponse} Updated`)
})

// API 5  DELETE METHOD:
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = ` 
  DELETE 
  FROM todo
  WHERE 
  id = ${todoId}`

  const deleteTodo = await db.get(deleteTodoQuery)
  response.send('Todo Deleted')
  console.log(deleteTodo)
})

module.exports = app
