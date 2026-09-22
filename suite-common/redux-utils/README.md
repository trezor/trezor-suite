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

## createEntityIndex

Lazily maintained derived indexes over store entities: a primary index and any number of secondary
indexes computed from a Redux slice on first read, rebuilt only for the partitions that changed,
with stable array identities for unchanged keys.

Nothing is stored in Redux and no reducer changes — the index derives itself from the slice it
selects, so it cannot drift from the data it mirrors.

```typescript
export const accountsIndex = createEntityIndex({
    name: 'accounts',
    selectSource: (state: AccountsRootState) => state.wallet.accounts,
    getId: (account: Account) => account.key,
    secondaryIndexes: { byNetwork: account => account.symbol },
});

accountsIndex.getBySecondaryKey(state, 'byNetwork', symbol); // in a selector or useSelector
accountsIndex.getById(getState(), accountKey); //               in a thunk
accountsIndex.getAllExcept(state, hiddenAccountKeys); //        everything but those
```

| Term                | What it means here                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **primary index**   | `ids` and `byId` — every entity by the id `getId` gives it, one entity per id.                                                                                                                                                                                                                                                                                                    |
| **secondary index** | A grouping index, one per entry in `secondaryIndexes`: a `Map` from a key the extractor returns to every entity that answers to it. A key names many entities, never at most one the way a unique index does — that is what the id is for. An extractor may return several keys, or `undefined` to leave the entity out of that index; under any one key an entity is there once. |
| **partition**       | A slice of the source that is written as a unit, declared by `getPartitions`. A write to one partition re-walks that partition only; without it the whole source is one partition.                                                                                                                                                                                                |
| **entities**        | What a partition holds. `getEntities` flattens a partition into them; without it a partition is taken to be its entities.                                                                                                                                                                                                                                                         |

An id belongs to one entity: `getId` is expected to be unique across the whole source, and an index
given two entities with the same id throws rather than answer one way by id and another by key. An
entity is under a key once, however many keys it names.

A secondary index is built on the first read that asks for it and not before, and the array under a
key keeps its identity for as long as its members do — which is what keeps a component watching one
key from re-rendering when another key changes.
