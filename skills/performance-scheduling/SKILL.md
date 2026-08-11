---
name: performance-scheduling
description: Main-thread scheduling for Trezor Suite — breaking up long tasks, yielding with scheduler.yield, and deferring non-essential work with requestIdleCallback. Use when a loop or a startup path blocks interaction, or when scheduling analytics, prefetch or other background work.
---

# Long and Non-Essential Tasks

Work that is correct but runs at the wrong moment. JavaScript runs to completion, so a task that holds the
main thread holds every interaction queued behind it, and work the user is not waiting for should not
compete with work they are. The two APIs named here are web and desktop; React Native has neither, and
`InteractionManager.runAfterInteractions` is its nearest equivalent, unused in this repo so far.

## Break a long task up and yield to the main thread

A task over 50 ms is a [long task](https://web.dev/articles/optimize-long-tasks), and everything past that
50 ms is its blocking period — JavaScript runs to completion, so nothing the user does lands until the
task ends. Splitting the work is not enough on its own: the loop has to hand control back between
batches, and the yield has to be unconditional. Do not gate it on `isInputPending()`; web.dev withdrew
that recommendation because it can report `false` after a real interaction, and input is not the only
thing that needs the frame.

```ts
// bad - one task over the whole queue, so a click arriving mid-loop waits for all of it
accountQueue.forEach(account => dispatch(accountsActions.createAccount(account)));

// good - a task per batch, with the main thread free in between
for (let i = 0; i < accountQueue.length; i += 25) {
    accountQueue
        .slice(i, i + 25)
        .forEach(account => dispatch(accountsActions.createAccount(account)));

    await yieldToMain();
}
```

`scheduler.yield()` is the yield primitive, and it resumes at the _front_ of the queue rather than the
back. Safari does not implement it, so web needs `scheduler-polyfill` or a `setTimeout(resolve, 0)`
fallback behind one `yieldToMain` helper; `suite-desktop` is Chromium and always has the real thing. Bare
`setTimeout(0)` is the fallback and not the goal — it appends to the end of the queue, and after five
nested timeouts the browser clamps each to a 5 ms floor. For work that is a React render rather than a
loop, the lever is `startTransition` or `useDeferredValue`, not a chunked loop.

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
