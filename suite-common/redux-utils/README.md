# @suite-common/redux-utils

Shared Redux and Redux Toolkit utilities such as `createThunk`, reducer helpers, middleware helpers,
and selector utilities.

This package temporarily depends on `@suite-common/redux-extra-dependencies` because `createThunk`
still uses the legacy `CustomThunkAPI` default. Once every thunk declares its own dependencies,
`CustomThunkAPI` and this temporary dependency can be removed.

## createThunk

This function has the same signature as `createAsyncThunk`, but it injects extra dependencies as the
`extra` parameter. It also has predefined recommended types, so it should be used instead of
`createAsyncThunk` from Redux Toolkit.

```typescript
export const exportTransactionsToFileThunk = createThunk(
    'exportAccountsToFileThunk',
    (payload: string, { dispatch, extra }) => {
        const fileName = payload;
        const {
            services: { getTransactions },
            utils: { saveFile },
        } = extra;

        const transactions = getTransactions();

        return saveFile(JSON.stringify(transactions), fileName);
    },
);
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
    AnyAction,
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
export const prepareDependencyFreeMiddleware = createMiddlewareWithExtraDeps<void, AnyAction, void>(
    (action, { next }) => next(action),
);
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
