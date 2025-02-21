//dependencies//imports
const express = require("express");
const pg = require("pg");
//express app
const app = express();
//db client
const client = new pg.Client(
  "postgres://denver.axelsen:1234@localhost:5432/acme_hr_db"
);
const path = require("path");

app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(express.json());

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
SELECT * FROM employees
`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/departments", async (req, res, next) => {
    try {
      const SQL = `
  SELECT * FROM departments
  `;
      const response = await client.query(SQL);
      res.send(response.rows);
    } catch (ex) {
      next(ex);
    }
  });

app.post("/api/employees", async (req, res, next) => {
    const { name, department_id } = req.body
    try {
        const response = await client.query(
        "INSERT INTO employees(name, department_id) VALUES ($1, $2) RETURNING*",
        [name, department_id]
        )
        res.send(response.rows)
    } catch(ex) {
        next(ex)
    }
})

app.delete("/api/employees/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const response = await client.query(
        "DELETE FROM employees WHERE id = $1",
        [id]
      );
      res.send(response.rows[0]);
    } catch (ex) {
      next(ex);
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    const { id } = req.params;
    const { department_id } = req.body
    try {
      const response = await client.query(
        "UPDATE employees SET department_id = $1 WHERE id = $2 RETURNING *",
        [department_id, id]
      );
      res.send(response.rows[0]);
    } catch (ex) {
      next(ex);
    }
  });

const init = async () => {
  await client.connect();
  const SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50));
    
    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL);
    
    INSERT INTO departments(name) VALUES('accounting'), ('creative'), ('it'), ('hr');
    INSERT INTO employees(name, department_id) VALUES('Donna', (SELECT id from departments WHERE name='accounting')),
    ('Alistair', (SELECT id from departments WHERE name='creative')),
    ('Tracey', (SELECT id from departments WHERE name='it')),
    ('Henry Russell', (SELECT id from departments WHERE name='hr'))`;

  await client.query(SQL);
  app.listen(3000, () => console.log("listening on port 3000"));
};

init();
