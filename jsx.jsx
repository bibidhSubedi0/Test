import React, { useState, useEffect } from "react";

// Bug 1: Missing key prop in list render — React will warn and reconciliation breaks
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li>{user.name}</li>
      ))}
    </ul>
  );
}

// Bug 2: useEffect with missing dependency — stale closure over 'userId'
function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setProfile);
  }, []); // userId missing from dep array — won't re-fetch when userId changes

  return <div>{profile ? profile.name : "Loading..."}</div>;
}

// Bug 3: setState called directly on state object — React won't detect the change
function Counter() {
  const [state, setState] = useState({ count: 0 });

  function increment() {
    state.count += 1; // mutating state directly
    setState(state);  // passing the same object reference — no re-render
  }

  return <button onClick={increment}>Count: {state.count}</button>;
}

// Bug 4: setting state inside render (infinite re-render loop)
function BadTimer() {
  const [time, setTime] = useState(Date.now());
  setTime(Date.now()); // called unconditionally during render

  return <p>Time: {time}</p>;
}

// Bug 5: index as key — breaks reconciliation when list order changes
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo.text}</li>
      ))}
    </ul>
  );
}

// Bug 6: async event handler with no error handling
function SubmitButton({ data }) {
  async function handleClick() {
    const res = await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log(result);
    // no try/catch — any network error goes completely unhandled
  }

  return <button onClick={handleClick}>Submit</button>;
}

// Bug 7: dangerouslySetInnerHTML with unsanitized user input — XSS risk
function CommentBox({ userComment }) {
  return <div dangerouslySetInnerHTML={{ __html: userComment }} />;
}

export { UserList, UserProfile, Counter, BadTimer, TodoList, SubmitButton, CommentBox };