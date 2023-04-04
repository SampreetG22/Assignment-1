const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isMatch = require("date-fns/isMatch");
const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();
var format = require("date-fns/format");

app.use(express.json());

let dataBase = null;

const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearch_q = (requestQuery) => {
  return true;
};

const dateCheck = (date, month) => {
  if (1 <= parseInt(date) <= 31 && 1 <= parseInt(month) <= 12) {
    return true;
  } else {
    return false;
  }
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API-1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryList = ["HOME", "WORK", "LEARNING"];
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (statusList.includes(status)) {
        getTodosQuery = `
        SELECT
            id,todo,priority,status,category,due_date as dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
        data = await dataBase.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //////////////

    case hasPriorityProperty(request.query):
      if (priorityList.includes(priority)) {
        getTodosQuery = `
        SELECT
            id,todo,priority,status,category,due_date as dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
        data = await dataBase.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    ///////////

    case hasCategoryProperty(request.query):
      if (categoryList.includes(category)) {
        getTodosQuery = `
        SELECT
            id,todo,priority,status,category,due_date as dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;
        data = await dataBase.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    ///////////////

    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo 
    WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      data = await dataBase.all(getTodosQuery);
      response.send(data);
      break;

    //////////

    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo 
    WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      data = await dataBase.all(getTodosQuery);
      response.send(data);
      break;

    ///////////

    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo 
    WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
      data = await dataBase.all(getTodosQuery);
      response.send(data);
      break;

    ///////////

    case hasSearch_q(request.query):
      getTodosQuery = `
    SELECT
        id,todo,priority,status,category,due_date as dueDate
    FROM
        todo 
    WHERE
        todo LIKE '%${search_q}%';`;
      data = await dataBase.all(getTodosQuery);
      response.send(data);
      break;

    default:
      response.status(400);
      data = `Invalid Todo '${request.query}'`;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificItem = `
SELECT 
    id,todo,priority,status,category,due_date as dueDate
FROM 
    todo
WHERE 
    id = ${todoId};`;
  const dbResponse = await dataBase.get(getSpecificItem);
  response.send(dbResponse);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `select * from todo where due_date='${newDate}';`;
    const responseResult = await dataBase.all(requestQuery);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const statusList = ["TO DO", "DONE", "IN PROGRESS"];
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
  const { id, todo, category, priority, status, dueDate } = request.body;
  var parts = dueDate.split("-");
  var myDate = new Date(parts[0], parts[1], parts[2]);
  var stringedDate = format(myDate, "yyyy-MM-dd");
  if (status !== undefined && statusList.includes(status)) {
    if (priority !== undefined && priorityList.includes(priority)) {
      if (category !== undefined && categoryList.includes(category)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
            INSERT INTO
                todo (id, todo, category,priority, status, due_date)
            VALUES
                (${id}, '${todo}', '${category}','${priority}', '${status}', '${postNewDueDate}');`;
          await dataBase.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await dataBase.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await dataBase.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await dataBase.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

      await dataBase.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await dataBase.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`;

        await dataBase.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await dataBase.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
