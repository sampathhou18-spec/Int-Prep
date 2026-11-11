<!--
Format: # = tab, ## = card, ### = follow-up, > **Tip:** = tip box, ```csharp = code.
See content/javascript.md for the full guide.
-->

# Concepts

## Dependency injection lifetimes

| Lifetime | One instance per… | Example |
|---|---|---|
| `AddTransient` | every time it's requested | lightweight stateless helpers |
| `AddScoped` | HTTP request | `DbContext`, unit of work |
| `AddSingleton` | application | config, caches |

```csharp
builder.Services.AddScoped<IOrderService, OrderService>();
```

> **Tip:** Never inject a Scoped service into a Singleton — it becomes a "captive dependency".

## Middleware pipeline

Each middleware can run code before and after calling `next`. Order matters: requests go down the pipeline in the order registered, responses come back up in reverse.

# Questions

## `IEnumerable` vs `IQueryable`?

- `IEnumerable<T>` — filtering runs **in memory** (LINQ to Objects).
- `IQueryable<T>` — builds an **expression tree** that the provider (e.g. EF Core) translates to SQL, so filtering runs **in the database**.

```csharp
// Filters in SQL
var active = db.Users.Where(u => u.IsActive).ToList();

// Loads every user, then filters in memory
IEnumerable<User> all = db.Users;
var active2 = all.Where(u => u.IsActive).ToList();
```

### What is deferred execution?

A LINQ query doesn't run when you define it — it runs when you enumerate it (`foreach`, `ToList()`, `Count()`, …).

# Programs

## Custom middleware

```csharp
app.Use(async (context, next) =>
{
    var sw = System.Diagnostics.Stopwatch.StartNew();
    await next(context);
    Console.WriteLine($"{context.Request.Path} took {sw.ElapsedMilliseconds} ms");
});
```

## Find duplicates in a list with LINQ

```csharp
var nums = new[] { 1, 2, 3, 2, 4, 1 };
var dups = nums.GroupBy(n => n)
               .Where(g => g.Count() > 1)
               .Select(g => g.Key);   // 1, 2
```
