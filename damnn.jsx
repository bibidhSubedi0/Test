import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─────────────────────────────────────────────
// 1. AUTH CONTEXT
// ─────────────────────────────────────────────

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token")); // Bug 1: localStorage access during SSR crashes Next.js

  useEffect(() => {
    if (token) {
      fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setUser(data)); // Bug 2: no .catch() — unhandled rejection
    }
  }, []); // Bug 3: token missing from dep array — stale closure

  function login(email, password) {
    return axios.post("/api/login", { email, password }).then((res) => {
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token); // Bug 4: storing JWT in localStorage — XSS risk
      setUser(res.data.user);
    });
    // Bug 5: no error handling on login failure
  }

  function logout() {
    setToken(null);
    setUser(null);
    // Bug 6: token never removed from localStorage on logout
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


// ─────────────────────────────────────────────
// 2. DASHBOARD
// ─────────────────────────────────────────────

export function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Bug 7: missing dependency array entirely — runs on every render
  useEffect(() => {
    setLoading(true);
    axios.get("/api/stats").then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  });

  // Bug 8: setting state during render (outside useEffect) — infinite loop
  if (!stats.initialized) {
    setStats({ ...stats, initialized: true });
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      <StatCard title="Users" value={stats.users} />
      <StatCard title="Revenue" value={stats.revenue} />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ padding: 16, margin: 8, background: "#f0f0f0" }}>
      <h3>{title}</h3>
      {/* Bug 9: no null/undefined check — renders "undefined" if value not yet loaded */}
      <p>{value.toLocaleString()}</p>
    </div>
  );
}


// ─────────────────────────────────────────────
// 3. USER LIST
// ─────────────────────────────────────────────

export function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("/api/users").then((res) => setUsers(res.data));
  }, []);

  // Bug 10: filtering on every render with no memoization — expensive for large lists
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        placeholder="Search..."
        onChange={(e) => setSearch(e.target.value)}
        value={search}
      />
      <ul>
        {/* Bug 11: index as key — breaks reconciliation when list is filtered/sorted */}
        {filtered.map((user, index) => (
          <li key={index}>
            {/* Bug 12: dangerouslySetInnerHTML with unsanitized user data — XSS */}
            <span dangerouslySetInnerHTML={{ __html: user.bio }} />
            <span>{user.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


// ─────────────────────────────────────────────
// 4. FORM
// ─────────────────────────────────────────────

export function CreateUserForm({ onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    // Bug 13: mutating state directly instead of spreading
    form[field] = value;
    setForm(form); // same object reference — React won't re-render reliably
  }

  async function handleSubmit() {
    // Bug 14: no input validation before sending to API
    try {
      const res = await axios.post("/api/users", form);
      onSuccess(res.data);
    } catch (e) {
      setError(e); // Bug 15: storing full Error object in state — not serializable
    }
  }

  return (
    <div>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      <select onChange={(e) => handleChange("role", e.target.value)}>
        <option value="">Select role</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      <button onClick={handleSubmit}>Create User</button>
    </div>
  );
}


// ─────────────────────────────────────────────
// 5. DATA TABLE WITH PAGINATION
// ─────────────────────────────────────────────

export function DataTable({ endpoint }) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Bug 16: no cleanup — if component unmounts mid-fetch, setState called on unmounted component
    axios.get(`${endpoint}?page=${page}`).then((res) => {
      setData(res.data.items);
      setTotal(res.data.total);
    });
  }, [page, endpoint]);

  // Bug 17: == instead of === for page comparison
  const isLastPage = total / 10 == page;

  return (
    <div>
      <table>
        <tbody>
          {/* Bug 18: missing key prop on rows */}
          {data.map((row) => (
            <tr>
              <td>{row.id}</td>
              <td>{row.name}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
        Prev
      </button>
      <button onClick={() => setPage((p) => p + 1)} disabled={isLastPage}>
        Next
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────
// 6. REAL-TIME NOTIFICATIONS
// ─────────────────────────────────────────────

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Bug 19: WebSocket never closed on unmount — memory leak
    wsRef.current = new WebSocket("wss://api.example.com/notifications");

    wsRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data); // Bug 20: no try/catch on JSON.parse — crashes on malformed message
      setNotifications((prev) => [...prev, msg]);
    };

    // Bug 21: no return cleanup function — ws stays open forever
  }, []);

  function dismissAll() {
    // Bug 22: mutating state array directly
    notifications.length = 0;
    setNotifications(notifications);
  }

  return (
    <div>
      <h2>Notifications ({notifications.length})</h2>
      <button onClick={dismissAll}>Dismiss All</button>
      {notifications.map((n, i) => (
        // Bug 23: index as key in a list that can have items removed
        <div key={i} style={{ padding: 8, borderBottom: "1px solid #ccc" }}>
          {n.message}
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// 7. SEARCH WITH DEBOUNCE
// ─────────────────────────────────────────────

export function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");

  // Bug 24: useCallback with empty dep array — stale closure over onResults
  const search = useCallback(async () => {
    if (query.length < 2) return; // Bug 25: == vs >= — single char queries still slip through
    const res = await axios.get(`/api/search?q=${query}`); // Bug 26: query not URL-encoded — breaks on special chars
    onResults(res.data);
  }, []);

  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}


// ─────────────────────────────────────────────
// 8. SETTINGS PAGE
// ─────────────────────────────────────────────

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get("/api/settings").then((res) => setSettings(res.data));
  }, []);

  async function save() {
    await axios.post("/api/settings", settings); // Bug 27: no try/catch — unhandled rejection on network error
    setSaved(true);
    // Bug 28: saved flag never reset — shows "Saved!" forever after first save
  }

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div>
      <h2>Settings</h2>
      <label>
        Theme:
        <select
          value={settings.theme}
          onChange={(e) =>
            setSettings({ ...settings, theme: e.target.value })
          }
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Notifications:
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) =>
            setSettings({ ...settings, notifications: e.target.checked })
          }
        />
      </label>
      <button onClick={save}>Save</button>
      {saved && <p style={{ color: "green" }}>Saved!</p>}
    </div>
  );
}