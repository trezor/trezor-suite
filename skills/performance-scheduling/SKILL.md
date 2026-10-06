---
name: performance-scheduling
description: Deferring non-essential work with requestIdleCallback. Use when a startup path blocks interaction, or when scheduling analytics, prefetch or other background work.
---

# Long and Non-Essential Tasks

Work that is correct but runs at the wrong moment. JavaScript runs to completion, so a task that holds the main thread holds every interaction queued behind it, and work the user is not waiting for should not compete with work they are.

## Schedule non-essential work in an idle callback

Analytics, telemetry, prefetch and cache warming are not what the user is waiting for, so they should not
compete with what is. `requestIdleCallback` runs them in the gaps between frames instead of on the
startup path — `analyticsActions.init()` currently dispatches from a `useEffect` in `Preloader.tsx`, which
is exactly the critical path this moves work off.

```ts
// bad - Preloader.tsx - analytics init competes with first paint and device discovery
useEffect(() => {
    dispatch(analyticsActions.init());
}, [dispatch]);

// good - the user sees the app first; the timeout guarantees it still runs
useEffect(() => {
    const id = requestIdleCallback(() => dispatch(analyticsActions.init()), { timeout: 2000 });

    return () => cancelIdleCallback(id);
}, [dispatch]);
```

Always pass `timeout`: without one a busy page can go seconds before the callback fires, and on a page
that never idles it may not fire at all. `requestIdleCallback` is not Baseline — no Safari — so web needs
a `setTimeout` fallback, and React Native has no such API, so this is a web and desktop rule only. It is
also not a dumping ground: nothing the user is waiting on, and no DOM writes that have to land in a
particular frame, because the callback runs with a budget it expects you to respect. There are no call
sites in the repo yet, so the first one sets the pattern.

## Related skills

- [Asymptotic complexity](../performance-complexity/SKILL.md) — indexing, sorting and reducing over
  collections that grow.
- [React hooks](../performance-react-hooks/SKILL.md) — memoization, dependency arrays, render loops.
- [DOM and CSS](../performance-dom/SKILL.md) — forced layout, observers, compositor-only animation.
