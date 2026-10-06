# @suite-common/redux-utils

Shared Redux and Redux Toolkit utilities such as `createThunk`, reducer helpers, middleware helpers,
and selector utilities.

## createThunk

This function has the same signature as `createAsyncThunk`, but it injects extra dependencies as the
`extra` parameter. A thunk can access only the state and dependencies declared in its third generic.
Omitting that generic gives it no state or injected dependencies.

```typescript
type ExportTransactionsToFileThunkDeps = {
    services: { getTransactions: () => unknown };
    utils: { saveFile: (content: string, fileName: string) => void };
};

export const exportTransactionsToFileThunk = createThunk<
    void,
    string,
    { extra: ExportTransactionsToFileThunkDeps }
>('exportAccountsToFileThunk', (payload, { extra }) => {
    const fileName = payload;
    const {
        services: { getTransactions },
        utils: { saveFile },
    } = extra;

    const transactions = getTransactions();

    return saveFile(JSON.stringify(transactions), fileName);
});
```

## createReducerWithExtraDeps

This function has the same signature as `createReducer`, but injects extra dependencies after the
`builder` parameter. It generates `prepareReducer` instead of `reducer`. Use it only when a reducer
needs extra dependencies; otherwise use Redux Toolkit's `createReducer`.

```typescript
const initialState = {
    greetings: 'hello',
    notificationGreetings: 'ciao',
};
const setGreetingsAction = createAction<string>('someAction');

export const prepareGreetingsReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder
            .addCase(extra.actions.notificationsAddEvent, (state, action) => {
                state.notificationGreetings = action.payload;
            })
            .addCase(setGreetingsAction, (state, action) => {
                state.greetings = action.payload;
            });
    },
);
```

To use the reducer, inject the dependencies at the composition root:

```typescript
import { prepareGreetingsReducer } from '@suite-common/greetings';
import { extraDependencies } from '../support/extraDependencies';

const rootReducer = combineReducers({
    greetingsReducer: prepareGreetingsReducer(extraDependencies),
});
```

## createSliceWithExtraDeps

This function has the same signature as `createSlice`, but injects extra dependencies into
`extraReducers` and generates `prepareReducer` instead of `reducer`. Use Redux Toolkit's
`createSlice` when extra dependencies are not required.

```typescript
const someSlice = createSliceWithExtraDeps({
    name: 'someSlice',
    initialState: {
        someState: 'someState',
    },
    reducers: {
        // normal reducers like we define them in normal createSlice
    }
    extraReducers: (builder, extra) => {
        builder
            .addCase(extra.actions.notificationsAddEvent, (state, action) => {
                state.someState = action.payload
            })
    }
});

export prepareSomeReducer = someSlice.prepareReducer;
```

Inject the dependencies at the composition root:

```typescript
import { prepareSomeReducer } from '@suite-common/somePackage';
import { extraDependencies } from '../support/extraDependencies';

const rootReducer = combineReducers({
    someReducer: prepareSomeReducer(extraDependencies),
});
```

## createMiddleware

This helper simplifies middleware creation. It calls `next(action)` unless you handle `next`
manually.

```typescript
const someMiddleware = createMiddleware((action, { getState, next }) => {
    switch (action.type) {
        case 'someAction':
        // do something
    }

    return next(action);
});
```

## createMiddlewareWithExtraDeps

This function is similar to `createMiddleware`, but injects extra dependencies into the middleware
API.

```typescript
type SomeMiddlewareDeps = {
    actions: AddTransactionDep;
    services: GetTransactionsDep;
};

export const prepareSomeMiddleware = createMiddlewareWithExtraDeps<
    SomeMiddlewareDeps,
    UnknownAction,
    SomeMiddlewareState
>((action, { getState, extra, next }) => {
    const {
        actions: { addTransaction },
        services: { getTransactions },
    } = extra;

    switch (action.type) {
        case addTransaction.type:
        // do something
    }

    return next(action);
});
```

All three types are mandatory. Use `void` explicitly when a middleware has no dependencies or does
not read state:

```typescript
export const prepareDependencyFreeMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    void
>((action, { next }) => next(action));
```

Inject the dependencies when constructing the middleware list:

```typescript
import { prepareSomeMiddleware } from '@suite-common/somePackage';
import { extraDependencies } from '../support/extraDependencies';

const middleware = [
    prepareSomeMiddleware(extraDependencies),
    toastMiddleware,
    ...walletMiddleware,
    ...suiteMiddlewares,
    ...otherMiddlewares,
];
```

## Indexes

Lookups over store entities, built from a selector rather than kept beside the store, so they
cannot drift from the data. Every index hands back the same snapshot while nothing it reads
changed, and every build says which ids were added, removed and updated — so an index built over
another index is driven by that change set and does work only for what moved. Four links:

| Link                   | Shape | Re-does, on a write                                                               |
| ---------------------- | ----- | --------------------------------------------------------------------------------- |
| `createIndex`          | 1 → 1 | One shallow compare per entity; the fold of none.                                 |
| `createAggregateIndex` | N → 1 | Expands the changed source entities, re-folds the ids they contribute to.         |
| `createDerivedIndex`   | 1 → 1 | Re-derives the entities whose source or named lookup entity changed.              |
| `createSecondaryIndex` | 1 → N | Asks the changed entities where they belong, relists the keys they moved between. |

The home asset table as such a chain — a write to one account re-expands one account, re-folds
the assets it holds, re-prices those, and touches no list but the one that moved:

```typescript
const accountsIndex = createIndex({
    name: 'accounts',
    source: selectVisibleDeviceAccounts,
    getId: a => a.key,
});
const assetsIndex = createAggregateIndex({
    name: 'assets',
    source: accountsIndex,
    expand: toPositions, //          one account into the positions it holds, memoised per account
    getId: position => position.assetKey,
    reduce: sumInto, //              the positions under one asset key into the asset
});
const ratesIndex = createIndex({ name: 'rates', source: selectRateEntries, getId: r => r.key });
const pricedAssetsIndex = createDerivedIndex({
    name: 'pricedAssets',
    source: assetsIndex,
    lookups: { rate: ratesIndex },
    getLookupIds: asset => ({ rate: asset.rateKey }),
    derive: (asset, { rate }) => price(asset, rate),
    sort: byFiatValue,
});
const assetsByNetwork = createSecondaryIndex({
    name: 'assetsByNetwork',
    source: pricedAssetsIndex,
    getKeys: a => a.symbol,
});
```

### createIndex and createSecondaryIndex

Three parts, each owning one thing:

- **A selector owns the shape.** It flattens, aggregates, orders and gives every entity its id —
  plain `createWeakMapSelector` code, free to rebuild its objects on every write.
- **`createIndex` owns identity.** It files the entities by id and matches each against the one it
  holds: an entity the selector rebuilt unchanged keeps the object a component already has, `ids`
  keeps its array while its members and order stand, and each build says which ids were added,
  removed and updated.
- **`createSecondaryIndex` owns membership.** It files the ids under another key — one key names
  many ids — and maintains itself from what the index said changed: only the entities that were
  added or updated are asked where they belong, and only the keys they moved between get a new
  list.

The home asset table, as such a chain:

```typescript
const selectAssets = createWeakMapSelector([selectAccounts, selectRates], toSortedAssets);

const assetsIndex = createIndex({
    name: 'assets',
    source: selectAssets,
    getId: (asset: Asset) => asset.assetKey,
});

const assetsByWallet = createSecondaryIndex({
    name: 'assetsByWallet',
    source: assetsIndex,
    getKeys: (asset: Asset) => asset.deviceState,
});

assetsByWallet.getIds(state, walletKey); //      in `useSelector`, for the list — a stable array
assetsIndex.getById(state, assetKey); //         in `useSelector`, for one row — a stable object
assetsByWallet.getEntities(state, walletKey); // the very objects `getById` hands back
assetsIndex.getById(getState(), assetKey); //    in a thunk
```

### Ids and keys are made by the index, and branded by it

An id `getId` answers as a plain string is branded with the index name — `assetsIndex` above hands
out `string & Branded<'assetsId'>` — and a key `getKeys` answers as a plain string is branded with
the secondary index name. An id or key that already carries a brand, such as `WalletAssetKey`, is
kept as it is. So a lookup takes only what the index itself gave out.

The shape of an id or key is written once, in the index, with `createId` / `createKey` from its
parts. The entity stands in for the parts when it has them, so `getId` / `getKeys` can be left out;
and a caller that has no entity — a section that knows its wallet and network — builds the key the
same one way:

```typescript
type NetworkKeyParts = { deviceState: string; symbol: string };

const assetsByNetwork = createSecondaryIndex({
    name: 'assetsByNetwork',
    source: assetsIndex,
    createKey: ({ deviceState, symbol }: NetworkKeyParts) => `${deviceState}/${symbol}`,
});

type NetworkKey = SecondaryIndexKeyOf<typeof assetsByNetwork>;

assetsByNetwork.createKey({ deviceState, symbol }); // from parts — what a section holds
assetsByNetwork.getKeysOfEntity(asset); //           from the entity
assetsIndex.getId(asset); //                         likewise for an id
assetsIndex.asId(raw); //                            a raw string, where that is all there is
```

With `createKey`, whatever `getKeys` answers are parts — one key per parts, so an entity under
several keys answers an array of them.

| `createIndex` option | What it does                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `source`             | A selector of the entities, or another index.                                                                             |
| `createId`           | The id from its parts, written once; exposed as `index.createId`. Lets `getId` be left out when the entity has the parts. |
| `getId`              | Where an entity is filed. Two entities of one source may not share an id; the index throws rather than pick one.          |
| `isEqual`            | Whether a new entity is the one held, in which case the held object stays. Shallow equality by default.                   |

| `createSecondaryIndex` option | What it does                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `source`                      | The index to look up.                                                                                                         |
| `createKey`                   | The key from its parts, written once; exposed as `index.createKey`. Lets `getKeys` be left out when the entity has the parts. |
| `getKeys`                     | The key or keys — or, with `createKey`, their parts — an entity answers to; `undefined` files it under none.                  |

What a read guarantees:

- **Lazy.** Nothing is built until something reads it; a secondary index is not even asked where
  the entities belong until its first read. A read against an unchanged source returns the very
  same snapshot, and an unchanged index is an unchanged secondary index.
- **Stable identities, never stale.** `getById` hands back the same object while the entity is
  equal to the one held, and the new object the moment it is not. `getIds` and `getIdSet` hand back
  the same array and set while members and order stand — a changed entity does not touch them — and
  new ones when an id is added, removed or moved. `getEntities` hands back the same array while the
  ids and every entity under them stand, and a new one when any of them changed. `getByIds`
  remembers its answer per ids array. A component watching one id or one key is not re-rendered by a
  write under another.
- **Maintained, not re-walked.** A write that changes one entity costs the index one shallow compare
  per entity and the secondary index one `getKeys` call — the one entity that changed. A write that
  adds, removes or reorders ids refiles the lists, but every list whose members stand keeps its
  array.
- **One generation.** Both hold the build before them and nothing older, so their memory does not
  grow with the history of the store.
