# @suite-common/reactive-collection

A tiny, framework-agnostic reactive collection: an identity-keyed store plus a
memoized query layer, with an optional React binding. Built for "wrap a list,
query it, subscribe to results" use cases where re-renders must stay minimal.

## Why

- **Identity-keyed.** Entities are stored by a stable id (`getId`). Re-adding a
  shallow-equal entity is a no-op — it neither bumps the version nor changes the
  stored reference.
- **O(1) change detection.** Every real mutation bumps a single integer
  `version`. Nothing diffs whole collections.
- **Memoized queries by value.** A query result is cached by `(version, arg)`,
  and `arg` is matched by value (`shallowEqual` by default) — so inline object
  filters created fresh each render still hit the cache.
- **Stable result references.** When a collection change doesn't affect a
  query's result, the previous result reference is reused (`resultEquals`). This
  is what lets `useCollectionQuery` (via `useSyncExternalStore`) skip re-renders
  on irrelevant changes.

## Usage

```ts
import { createCollection, useCollectionQuery } from '@suite-common/reactive-collection';

type Tx = { txid: string; title: string; amount: number };

const txs = createCollection<Tx>({ getId: t => t.txid });

// mutate (in an event handler / effect)
txs.addAll(fetchedTransactions);

// or replace the whole set — reconciled by id, unchanged entities keep their ref
txs.setAll(fetchedTransactions);

// define once — stable reference
const search = txs.defineQuery((items, filter: { q: string; minAmount: number }) =>
    items.filter(t => t.title.includes(filter.q) && t.amount >= filter.minAmount),
);

// in a component — re-renders only when the result actually changes
const results = useCollectionQuery(txs, search, { q: 'ahoj', minAmount: 0 });
```

### Incremental filters

`defineFilterQuery` is a filter whose predicate is re-evaluated **only for the
entities whose reference changed** since the last run (for the same arg). On a
`setAll` that touches one entity, only that entity is re-tested — ideal for
search over a large, frequently-reconciled list.

```ts
const matches = txs.defineFilterQuery((tx, filter: { q: string }) => tx.title.includes(filter.q));

const results = useCollectionQuery(txs, matches, { q: 'ahoj' });
```

### Debounced arguments

Debounce a fast-changing argument (e.g. a search input) while still reflecting
collection updates immediately:

```ts
const results = useCollectionQuery(txs, matches, { q: searchInput }, { debounceMs: 300 });
```

Outside React, call the query directly and/or `subscribe`:

```ts
const unsubscribe = txs.subscribe(() => console.log(search({ q: 'ahoj', minAmount: 0 })));
```

## API

- `createCollection<T>({ getId, equals? })` → `Collection<T>`
    - `add`, `addAll`, `setAll`, `remove`, `clear`, `has`, `get`, `getAll`, `size`,
      `getVersion`, `subscribe`, `defineQuery`, `defineFilterQuery`
- `defineQuery(fn, { argEquals?, resultEquals?, cacheSize? })` → `(arg) => result`
- `defineFilterQuery(predicate, { argEquals?, cacheSize? })` → `(arg) => readonly T[]`
- `useCollectionQuery(collection, query, arg, { debounceMs?, getArgKey? })` → memoized result
- `shallowEqual(a, b)` — the default equality used throughout
