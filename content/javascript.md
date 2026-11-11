<!--
HOW TO WRITE IN THIS FILE (this comment is not shown on the page)

# Section name        -> a tab (e.g. Concepts, Questions, Programs, Output-based)
## Question / topic   -> a collapsible card
### Follow-up         -> a click-to-open follow-up inside the card
> **Tip:** ...        -> a highlighted tip box
```js ... ```         -> highlighted code (js, jsx, ts, csharp, sql, python, json, bash...)
| a | b | tables, **bold**, `inline code`, lists all work.
-->

# Concepts

## Closures

A **closure** is a function that remembers the variables of the scope it was created in, even after that outer function has returned.

```js
function counter() {
  let count = 0;
  return () => ++count;   // inner function "closes over" count
}
const next = counter();
next(); // 1
next(); // 2
```

Used for: data privacy, function factories, memoization, debounce/throttle.

> **Tip:** Say "a function plus its lexical environment" — interviewers like that phrase.

## Hoisting

Declarations are moved to the top of their scope during compilation.

| Declaration | Hoisted? | Value before declaration |
|---|---|---|
| `var` | Yes | `undefined` |
| `let` / `const` | Yes, but in the Temporal Dead Zone | `ReferenceError` |
| `function` declaration | Yes, fully | Callable |
| function expression / arrow | Only the variable | Depends on `var`/`let` |

# Questions

## Difference between `==` and `===`?

- `==` compares **after type coercion**: `'5' == 5` → `true`
- `===` compares **value and type**: `'5' === 5` → `false`

Always prefer `===` unless you specifically want coercion (e.g. `x == null` to check both `null` and `undefined`).

### What does `[] == false` return?

`true` — both sides are coerced to numbers: `[]` → `''` → `0`, and `false` → `0`.

## What is the event loop?

JavaScript runs on a single thread. The **event loop** takes work from queues when the call stack is empty:

1. Run all synchronous code (call stack).
2. Run **all microtasks** (Promise callbacks, `queueMicrotask`).
3. Run **one macrotask** (`setTimeout`, I/O, events), then go back to step 2.

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
// A, D, C, B
```

## Difference between `let`, `const` and `var`?

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function | Block `{ }` | Block `{ }` |
| Re-declare in same scope | Yes | No | No |
| Re-assign | Yes | Yes | No |
| Hoisting | Hoisted as `undefined` | Hoisted, but in the Temporal Dead Zone | Hoisted, but in the Temporal Dead Zone |

```js
if (true) {
  var a = 1;
  let b = 2;
}
console.log(a); // 1
console.log(b); // ReferenceError: b is not defined

const user = { name: 'Sam' };
user.name = 'Ravi';   // allowed: the object can still change
user = {};            // TypeError: the variable can't be re-assigned
```

> **Tip:** Use `const` by default and `let` only when the value must change. Avoid `var`.

# Programs

## Reverse a string

```js
const reverse = s => s.split('').reverse().join('');

// Without built-ins
function reverseLoop(s) {
  let out = '';
  for (let i = s.length - 1; i >= 0; i--) out += s[i];
  return out;
}
```

## Implement debounce

```js
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const onSearch = debounce(q => console.log('search', q), 300);
```

> **Tip:** Debounce = run after the user *stops*. Throttle = run at most once every N ms.
