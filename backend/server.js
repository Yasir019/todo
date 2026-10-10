const express = require('express');
const { Pool } = require('pg');

const PORT = process.env.PORT || 5000;
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://todo:todo@localhost:5432/todo';

const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/todos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos ORDER BY id');
  res.json(rows);
});

app.post('/api/todos', async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { rows } = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
    [title]
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/todos/:id', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE todos SET done = $1 WHERE id = $2 RETURNING *',
    [Boolean(req.body.done), req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.delete('/api/todos/:id', async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

// The database container may start after the backend, so retry for a while.
async function initDb(retries = 15) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT false
        )
      `);
      return;
    } catch (err) {
      console.log(`Database not ready (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Could not connect to the database');
}

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
