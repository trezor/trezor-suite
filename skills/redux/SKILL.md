---
name: redux
description: Redux Toolkit patterns including slices, selectors, thunks, and middleware conventions for Trezor Suite. Use when writing or reviewing Redux state management code.
---

# Redux

## Introduction

**We use [redux-toolkit](https://redux.js.org/redux-toolkit/overview) for writing all of redux code.** It has functions that build in suggested best practices, including setting up the store to catch mutations and enable the Redux DevTools Extension, simplifying immutable update logic with Immer, and more.

## File structure

### Single-(Folder/Package) Logic for features

Co-locating logic for a given feature in one place typically makes it easier to maintain that code. This is also known as the ["ducks" pattern](https://github.com/erikras/ducks-modular-redux). While older Redux codebases often used a "file-by-type" approach with separate folders for "actions" and "reducers", keeping related logic together makes it easier to find and update that code.

This [Single-File approach](https://redux.js.org/style-guide/#structure-files-as-feature-folders-with-single-file-logic) is **strongly recommended by official Redux Style Guide** and offers many benefits over a "file-by-type" structure. In our case, in our monorepo, we do something similar but with packages and folders. Usually we have one package per feature or in some specific cases we have packages where you have multiple feature folders. Benefits of this approach:

1. **Co-locating logic makes maintenance easier** - Redux code is usually closely tied-up. Are you changing an action? You probably need to update a reducer. Are you changing the state shape? You will need to update selectors.
2. **Faster setup and less file system noise** - instead of creating two, three or maybe even four files (actions, reducers, selectors, thunks) in multiple folders you can quickly create all files you need in one folder.

### Examples of file/folder structure

```jsx
// good
myPackage / myPackageReducer.ts;
myPackageActions.ts;
myPackageThunks.ts;

// good
myPackage / myPackageReducer.ts;
myPackageActions.ts;
myPackageThunks.ts;
myPackageSelectors.ts;
```

## Slice structure:

1. **Slice name + action prefix** - Name of a slice that will also be used as a reducer name. Prefix is name of the package + name of the slice.

    ```tsx
    import { name as packageName } from './package.json';

    const sliceName = 'appSettings';
    const actionPrefix = `${packageName}/${sliceName}`;
    ```

2. **Slice State type** - this type is used to describe how state will look like and also serves as a simple documentation. Name follows pattern `${sliceName}State`.

    ```tsx
    export interface AppSettingsState {
        colorScheme: AppColorScheme;
        fiatCurrency: 'czk' | 'usd';
    }
    ```

3. **Slice Root State type** - type describing part of RootState which is accessible in this slice. Name follows pattern `${sliceName}RootState`.

    ```tsx
    type AppSettingsRootState = {
        appSettings: AppSettingsState;
    };
    ```

4. **Extra actions** - in some rare cases when you need to create an action manually using `createAction` instead of using `createSlice` generated actions, you should place them here.

    ```tsx
    export const doSomeMagic = createAction(`${actionPrefix}/doSomeMagic`);
    ```

5. **Slice** - slice created using RTK `createSlice` function.

    ```tsx
    const appSettingsSlice = createSlice({
        name: 'appSettings',
        initialState,
        reducers: {
            setColorScheme: (state, action: PayloadAction<AppColorScheme>) => {
                state.colorScheme = action.payload;
            },
        },
    });
    ```

6. **Selectors and lookups**
7. **Exports of actions and reducers**

### Slice exports

Keep the slice object private. Export its actions and reducer as named values. For slices created
with `createSliceWithExtraDeps`, export `prepareReducer` instead of the prepared reducer. Define
selectors as standalone exported functions so their declarations do not expose generated slice or
Reselect implementation types.

Explicitly type the `state` parameter of every case reducer. This keeps generated declaration files
from exposing Redux Toolkit's inferred slice implementation types.

```tsx
const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setColorScheme(state: AppSettingsState, action: PayloadAction<AppColorScheme>) {
            state.colorScheme = action.payload;
        },
    },
});

export const appSettingsActions = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
export const selectColorScheme = (state: AppSettingsRootState) => state.appSettings.colorScheme;
```

Do not export `appSettingsSlice`. Consumers should not depend on the complete inferred slice API.

Sources:

1. https://livebook.manning.com/book/redux-in-action/chapter-11/
2. **Redux Style Guide -** https://redux.js.org/style-guide/

## Selectors

### Do not access state directly

Prefer using predefined selectors to access state. Doing this simplifies refactoring in future. Inline selectors are ok for less used properties - so that we do not have to write helpers for every existing property.

```tsx
// bad
const transactions = useSelector(state => state.wallet.transactions[accountKey]);
const language = useSelector(state => state.settings.language);

// good
const transactions = useSelector(state => selectTransactions(state, accountKey));
const language = useSelector(selectLanguage);

// Thunks
const myThunk = createThunk('myThunk', ({ accountKey }, { getState }) => {
    // bad
    const transactions = getState().wallet.transactions[accountKey];

    // good
    const transactions = selectTransactions(getState(), accountKey);
});
```

If you decide to refactor, for example, the whole transaction data structure in the reducer state, you won't need to make changes in every place where it's accessed. The only place where you will need to make changes is that selector. You won't need to go over all components where you are accessing transactions. That's a huge benefit 🎉

### Using selectors in components

Try to step back from making `useSelector` hooks return an object. It has no benefits and might cause performance issues. Use one `useSelector` per value.

```tsx
// bad
const { myValue, myAnotherValue } = useSelector(state => ({
	myValue: state.something.myValue,
	myAnotherValue: state.something.myAnotherValue
});

// good
const myValue = useSelector(selectMyValue);
const myAnotherValue = useSelector(selectMyAnotherValue);
```

### Naming of selectors

Always prefix selectors with `select` and when you use them drop `select`. When selecting by a parameter, suffix the name like this: `selectAccountById` .

```tsx
// bad
const getAccount = ...;
const findAccount = ...;
const getAccountByKey ...;

// good
const selectAccount = ...;
const selectAccountByKey = ...;

// bad
const userAccount = useSelector(selectAccount);
const oldAccount = useSelector(selectAccount);
const foundAccount = useSelector(selectAccountByKey(key));

// good
const account = useSelector(selectAccount);
const account = useSelector(selectAccountByKey(key));
```

## Actions

- Use `createAction` for creating actions related to reducers which have not been converted to slices yet.
- For new reducers use slices and export actions from there

## Thunks

- For both synchronous and asynchronous thunks use the `createThunk()` method
- Use the `Thunk` postfix, e.g. `connectInitThunk()`
- Use `npm-module-or-app/reducer/ACTION_TYPE` for naming a thunk. Each slice should have an `actionPrefix` defined in `constants.ts`

```tsx
export const actionPrefix = '@common/wallet-core/accounts'

const disableAccountsThunk = createThunk(
    `${actionPrefix}/disableAccountsThunk`, ......
```

- Never use `const state = getState()` causing bugs because it will use an old snapshot of the state, use getState() directly when needed, e.g.

```tsx
await TrezorConnect.init({
    ...connectInitSettings,
    pendingTransportEvent: selectIsPendingTransportEvent(getState()),
});
```

- For async thunks, try to make use of the [lifecycle actions](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions) whenever it makes sense. For example, when you have an async thunk that fetches something and saves in state. If fetching was not successful, you can explicitly modify the slice state in a relevant way: add an error message, change some status or reset the state (if business logic deems no data better than not-up-to-date data)
- When using async thunks in effects, cancel the action by calling the [abort() method](https://redux-toolkit.js.org/api/createAsyncThunk#canceling-while-running) in effect cleanup.

### State and dependency contracts

A thunk must describe only the state and injected dependencies that it actually uses. This keeps
the thunk reusable in every application whose store satisfies that small contract and lets tests
provide only the relevant state and dependencies.

- Declare a named `<ThunkName>State` type next to every thunk that calls `getState()`. Build it from
  the smallest domain root-state types accepted by the selectors that the thunk calls. Do not use a
  full application state or infer the state contract with `Parameters<typeof selector>[0]`.
- Declare a named `<ThunkName>Deps` type next to every thunk that reads `extra`. Reuse domain-owned
  dependency contracts and combine them with intersections (`&`) instead of repeating their shape.
- A parent thunk must include the state and dependency contracts required by every child thunk it
  dispatches. The parent's store and dependency object must be able to run the whole dispatched
  chain, not only the first function.
- Pass `{ state: <ThunkName>State; extra: <ThunkName>Deps }` as the third `createThunk` generic. Omit
  whichever property the thunk does not need.
- Pass explicit `void` as the third generic when a thunk needs neither state nor injected
  dependencies. This is a compile-time guard against accidentally starting to use either one.
- Let the `createThunk` payload generic type the callback argument. Do not repeat the payload type on
  a destructured callback parameter.
- Do not use `ExtraDependencies`, `CustomThunkAPI`, `as any`, or a full dependency mock as a shortcut
  in feature code or tests.

```ts
type RefreshAccountThunkState = AccountsRootState & WalletSettingsRootState;
type RefreshAccountThunkDeps = AnalyticsDep & RefreshAccountTokensThunkDeps;

export const refreshAccountThunk = createThunk<
    void,
    RefreshAccountParams,
    { state: RefreshAccountThunkState; extra: RefreshAccountThunkDeps }
>(`${actionPrefix}/refreshAccount`, async ({ accountKey }, { dispatch, getState, extra }) => {
    // The implementation can use only the contract declared above.
});

export const closeDialogThunk = createThunk<void, CloseDialogParams, void>(
    `${actionPrefix}/closeDialog`,
    ({ dialogId }, { dispatch }) => {
        dispatch(closeDialog(dialogId));
    },
);
```

### Testing thunks without a Redux store

Unit-test a thunk as a function. Redux thunk middleware ultimately calls a thunk with three
arguments: `dispatch`, `getState`, and `extra`. A unit test can provide those arguments directly; it
does not need `configureMockStore`, application reducers, or the global dependency graph.

Use `createMockDispatch` from `@suite-common/redux-utils/mocks`. It stores every plain dispatched
action in an array and recursively executes function actions with the same test dependencies. Build
`getState` and `extra` from the thunk's exported contracts, and keep the fixture local to the test.
Mock external I/O at its own boundary; a Redux store is not needed for that either. For example,
`connectInitThunk` is tested with this shape. Its concrete state and dependency values are ordinary
local fixtures typed as `ConnectInitThunkState` and `ConnectInitThunkDeps`; they are omitted here so
the example focuses on running the thunk:

```ts
type ConnectInitThunkTestDeps = {
    actions: unknown[];
    dispatch: ConnectInitThunkDispatch;
    getState: () => ConnectInitThunkState;
    extra: ConnectInitThunkDeps;
};

const createThunkDeps = (
    state: ConnectInitThunkState,
    extra: ConnectInitThunkDeps,
): ConnectInitThunkTestDeps => {
    const getState = (): ConnectInitThunkState => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    return { actions, dispatch, getState, extra };
};

it('dispatches its lifecycle actions', async () => {
    const { actions, dispatch, getState, extra } = createThunkDeps(
        connectInitState,
        connectInitExtra,
    );

    // The first call supplies the thunk payload; the second call runs the returned thunk directly.
    await connectInitThunk()(dispatch, getState, extra);

    expect(actions).toEqual([
        expect.objectContaining({ type: connectInitThunk.pending.type }),
        expect.objectContaining({ type: connectInitThunk.fulfilled.type }),
    ]);
});
```

Global application state and dependency contracts are wiring details. Application code may refer to
them only in these composition-root files, where the final stores and service graphs are assembled:

- `packages/suite/src/support/extraDependencies.ts`
- `packages/suite/src/reducers/store.ts`
- `suite-native/state/src/extraDependencies.ts`
- `suite-native/state/src/store.ts`

Do not add another exception locally. If a new composition root is necessary, update this allowlist
and the corresponding architectural enforcement in the same change so the exception remains
visible and reviewable.

## Middlewares

Avoid usage of `const state = getState()` because assigning result of `getState()` to variable will create snapshot of state at a given moment and could lead to unintentionally accessing some old version of state. For example:

```tsx
createMiddleware((action, { next }) => {
    const state = getState();
    next(action); // this will dispatch action and change state
    // you are still accessing old version of state before change
    console.log(state);
    // this will always access current version of state
    console.log(getState());
});
```

This is something that could lead to hard-to-debug bugs, but sometimes you want to preserve previous version of state on purpose. In that case, avoid naming it just `state` but prefer something like `prevState` which will prevent anyone from thinking that it has an actual state.

Middlewares should be read-only - they should not dispatch actions or modify state. Otherwise, they produce code that is hard to read and test that leads to nasty bugs.
