<!--
Format: # = tab, ## = card, ### = follow-up, > **Tip:** = tip box, ```jsx = code.
See content/javascript.md for the full guide.
-->

# Concepts

## Virtual DOM and reconciliation

React keeps a lightweight copy of the UI in memory (the **virtual DOM**). On a state change it renders a new tree, **diffs** it with the previous one, and applies only the changed parts to the real DOM.

`key` props help React match list items between renders — use a stable id, not the array index, when items can be reordered.

## Rules of Hooks

1. Call hooks only at the **top level** — not inside loops, conditions or nested functions.
2. Call hooks only from **React function components** or **custom hooks**.

React relies on hooks being called in the same order on every render.

# Questions

## `useState` vs `useRef`?

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders? | Yes | No |
| Value | Read on each render | `ref.current`, mutable |
| Typical use | UI data | DOM nodes, timers, previous values |

### When does `useEffect` run?

After the component renders and the browser paints. With `[]` it runs once after mount; with `[a, b]` whenever `a` or `b` changes. The returned function is the cleanup.

# Programs

## Counter component

```jsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count} times
    </button>
  );
}
```

> **Tip:** Use the updater form `setCount(c => c + 1)` when the new value depends on the old one.

## Custom hook: `useFetch`

```jsx
import { useEffect, useState } from 'react';

export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => controller.abort();   // cancel if url changes or component unmounts
  }, [url]);

  return state;
}
```
