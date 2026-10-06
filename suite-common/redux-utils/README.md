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
| `createDerivedIndex`   | 1 → 1 | Makes again the entities whose source or joined entity changed.                   |
| `createSecondaryIndex` | 1 → N | Asks the changed entities where they belong, relists the keys they moved between. |

Every index answers `getIds(state)`, `getEntities(state)` and `getById(state, id)`; a secondary
index answers `getIds(state, key)`, `getEntities(state, key)` and `getKeys(state)`. That is the
whole surface a component or thunk sees. `read(state)` hands back the snapshot and is what one
index is built over another with.

The home asset table as such a chain — a write to one account re-expands one account, re-folds
the assets it holds, re-prices those, and touches no list but the one that moved:

```typescript
const accountsIndex = createIndex({
    name: 'accounts',
    source: selectVisibleDeviceAccounts,
    getId: account => account.key,
});

const assetsIndex = createAggregateIndex({
    name: 'assets',
    source: accountsIndex,
    expand: toPositions, // One account into the positions it holds, memoised per account.
    getId: position => position.assetKey,
    reduce: sumInto, //    The positions under one asset key into the asset.
});

const ratesIndex = createIndex({
    name: 'rates',
    source: selectRateEntries,
    getId: rate => rate.key,
});

const pricedAssetsIndex = createDerivedIndex({
    name: 'pricedAssets',
    source: assetsIndex,
    join: { rate: ratesIndex },
    joinBy: asset => ({ rate: asset.rateKey }),
    toEntity: (asset, { rate }) => price(asset, rate),
    sort: byFiatValue,
});

const assetsByNetwork = createSecondaryIndex({
    name: 'assetsByNetwork',
    source: pricedAssetsIndex,
    getKeys: asset => asset.symbol,
});

assetsByNetwork.getIds(state, symbol); //      in `useSelector`, for a section — a stable array
pricedAssetsIndex.getById(state, assetKey); // in `useSelector`, for a row — a stable object
pricedAssetsIndex.getById(getState(), assetKey); // in a thunk
```

### Ids and keys

An id is whatever `getId` answers, a key whatever `getKeys` answers — a branded type is kept as
it is. Where the shape of an id or key is better written once, give the index `createId` /
`createKey` from its parts: the entity stands in for the parts when it has them, so `getId` /
`getKeys` can be left out, and a caller that has no entity — a section that knows its wallet and
network — builds the key the same one way:

```typescript
type NetworkKeyParts = { deviceState: string; symbol: string };

const assetsByNetwork = createSecondaryIndex({
    name: 'assetsByNetwork',
    source: assetsIndex,
    createKey: ({ deviceState, symbol }: NetworkKeyParts) => `${deviceState}/${symbol}`,
});

assetsByNetwork.createKey({ deviceState, symbol }); // typed by the parts; only there when given
```

`IndexIdOf`, `IndexEntityOf` and `SecondaryIndexKeyOf` read the types off an index.

### What a read guarantees

- **Lazy.** Nothing is built until something reads it. A read against an unchanged source returns
  the very same snapshot, and an unchanged index is an unchanged index over it.
- **Stable identities, never stale.** `getById` hands back the same object while the entity is
  equal to the one held, and the new object the moment it is not. `getIds` hands back the same
  array while members and order stand — a changed entity does not touch it — and a new one when
  an id is added, removed or moved. `getEntities` the same array while the ids and every entity
  under them stand. A component watching one id or one key is not re-rendered by a write under
  another.
- **Maintained, not re-walked.** Each link does work only for what the link before it said
  changed. A write to one account costs one shallow compare per account, one expansion, the fold
  of the assets that account holds, the pricing of those, and nothing in the lists.
- **One generation.** Every index holds the build before it and nothing older, so its memory does
  not grow with the history of the store.

### One lineage per index

An index keeps the build before it, which is what lets it maintain itself rather than rebuild —
and which means an index instance follows one store. Build the indexes an application needs in its
composition root, as its services are, one set per store; a test builds its own.
