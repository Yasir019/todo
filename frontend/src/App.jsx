import { useEffect, useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function request(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.status === 204 ? null : res.json();
  }

  async function loadTodos() {
    try {
      setTodos(await request('/api/todos'));
      setError('');
    } catch (err) {
      setError(`Could not reach the API: ${err.message}`);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function addTodo(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setTitle('');
      loadTodos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      await request(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !todo.done }),
      });
      loadTodos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTodo(todo) {
    try {
      await request(`/api/todos/${todo.id}`, { method: 'DELETE' });
      loadTodos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Todo</h1>

      <form onSubmit={addTodo}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs doing?"
          aria-label="New todo"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label className={todo.done ? 'done' : ''}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo)}
              />
              {todo.title}
            </label>
            <button onClick={() => deleteTodo(todo)} aria-label={`Delete ${todo.title}`}>
              ×
            </button>
          </li>
        ))}
      </ul>

      {!error && todos.length === 0 && <p className="empty">Nothing to do yet.</p>}
    </main>
  );
}
