# @suite-common/redux-utils

This package provides utility functions for working with redux-toolkit and it also provide abstraction for injecting extra dependencies from `packages/suite` into common packages.

## Extra dependencies concept

In `src/extraDependenciesType.ts` you can find type which is used as source of truth for extra dependencies object that is constructed separately in desktop and mobile app. Thanks to this you can easily pass dependencies from `packages/suite` to your `@suite-common` packages.

Example of simple definition of extra types:

```typescript
export type ExtraDependencies = {
    actions: {
        addTransaction: SuiteCompatibleActionCreatorWithPayload<Transaction>;
    };
    selectors: {
        selectTransactions: SuiteCompatibleSelector<Transactions[]>;
    };
};
```

Now you will use this type in desktop suite to construct object that will implement this type:

```typescript
import * as transactionsActions from '@wallet-actions/transactionsActions';
import { AppState } from '../types/suite';

export const extraDependencies: ExtraDependencies = {
    actions: {
        addTransaction: transactionsActions.add,
    },
    selectors: {
        selectTransactions: (state: AppState) => state.wallet.transactions.transactions,
    },
};
```

And we do same thing for mobile app, but here you will actually use some mocked action and transaction data. We need to do this because that functionality is not moved to `@suite-common` package.

```typescript
export const extraDependencies: ExtraDependencies = {
    actions: {
        addTransaction: createAction<any>('@suite-native/notImplemented/addTransaction'),
    },
    selectors: {
        selectTransactions: () => [...testMocks.getWalletTransaction()],
    },
};
```

In case someone will move that functionality to `@suite-common` we should remove it from extra dependencies. For example if someone will create `@suite-common/wallet-transactions` package we will remove `selectTransactions` from extra dependencies and import it from that package directly.

## Platform specific APIs

This extra dependencies is not only useful during migration process from `packages/suite` monolith to smaller package in `@suite-common`, but also very useful for providing platform specific APIs to common packages. Let's add some platform specific utility to save files:

```typescript
export type ExtraDependencies = {
    ...,
    utils: {
        saveFile: (fileContent: string, fileName: string) => Promise<void>;
    };
};
```

File saving functionality is platform specific we need to use different libraries for different platforms. This is `extraDependencies` for desktop app:

```typescript
import { saveAs } from 'file-saver';

export const extraDependencies: ExtraDependencies = {
    ...,
    utils: {
        saveFile: (fileContent, fileName) => saveAs(fileContent, fileName),
    },
};
```

And same thing but using different native API for mobile app:

```typescript
import RNFS from 'react-native-fs';

export const extraDependencies: ExtraDependencies = {
    ...,
    utils: {
        saveFile: (fileContent, fileName) => RNFS.writeFile(fileName, fileContent, 'utf8'),
    },
};
```

Now we have everything ready and we can use our extra dependencies in common packages and this package will provide you with functions that will help you with it:

## createThunk

This functions has exact same signature as `createAsyncThunk` but it will inject extra dependencies as `extra` param. It also has some predefined recommended types that should be use everywhere, so it should be always used as instead of `createAsyncThunk` from redux-toolkit.

```typescript
export const exportTransactionsToFileThunk = createThunk(
    'exportAccountsToFileThunk',
    (payload: string, { dispatch, extra, getState }) => {
        const fileName = payload;
        const {
            selectors: { selectTransactions },
            utils: { saveFile },
        } = extra;

        const transactions = selectTransactions(getState());

        return saveFile(JSON.stringify(transactions), fileName);
    },
);
```

## createReducerWithExtraDeps

This functions has exact same signature as `createReducer` but it will inject extra dependencies from `extra` param after `builder`. It will generate `prepareReducer` instead of `reducer`. You should only use this function if you want to use extra dependencies in your reducer, otherwise you should use plain `createReducer` from redux-toolkit.

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

Now if you want to use this reducer in app you need do it like this:

```typescript
import { prepareGreetingsReducer } from '@suite-common/greetings';
import { extraDependencies } from '../support/extraDependencies';

const rootReducer = combineReducers({
    greetingsReducer: prepareGreetingsReducer(extraDependencies),
});
```

## createSliceWithExtraDeps

This functions has exact same signature as `createSlice` but it will inject extra dependencies from `extra` into `extraReducers` and generate `prepareReducer` instead of `reducer`. You should only use this function if you want to use extra dependencies in your slice, otherwise you should use `createSlice` from redux-toolkit.

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

Now if you want to use this reducer in app you need do it like this:

```typescript
import { prepareSomeReducer } from '@suite-common/somePackage';
import { extraDependencies } from '../support/extraDependencies';

const rootReducer = combineReducers({
    someReducer: prepareSomeReducer(extraDependencies),
});
```

## createMiddleware

Helper function that will unify and simplify creating of middleware. You don't need to care about calling `next(action)` etc. In case you need to handle `next` manually you can still use legacy way.

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

This functions is very similar to `createMiddleware` but it will inject extra dependencies from extra dependencies as `extra` into middleware api.

```typescript
export const prepareSomeMiddleware = createMiddlewareWithExtraDeps(
    (action, { getState, extra, next }) => {
        const {
            actions: { addTransaction },
            selectors: { selectTransactions },
        } = extra;

        switch (action.type) {
            case addTransaction.type:
            // do something
        }

        return next(action);
    },
);
```

Also usage is different than normal middleware, because you need to inject extra dependencies.

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
