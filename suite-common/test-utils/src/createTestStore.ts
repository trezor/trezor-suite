import {
    type Middleware as RTKMiddleware,
    type Reducer,
    type ReducersMapObject,
    type UnknownAction,
    configureStore,
    isFulfilled,
    isPending,
} from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { createMiddleware } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

/*
 * This function is useful, because a lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = <Action extends UnknownAction>(actions: Action[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));

export type CreateTestStoreParams<S, A extends UnknownAction, Extra> = {
    middleware?: any[];
    extra: Extra;
    // The third generic (PreloadedState) sits in a contravariant position in redux's Reducer
    // signature, so neither `unknown` nor `Record<string, never>` work as drop-in replacements
    // for `{}` here — both reject test fixtures that pass a Partial<S> as preloaded state.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    reducer?: Reducer<S, A, {}> | ReducersMapObject<S, A, {}>;
    preloadedState?: any;
    serializableCheck?: { ignoredActions?: string[] };
};

// createThunk represents `void` dependencies as an empty object internally. Mirror that here so
// dependency-free thunks remain dispatchable while tests still have to pass `extra: undefined`.
type MockStoreExtra<Extra> = [Extra] extends [void] ? Record<never, never> : Extra;
type InitPreloadedStateParams = {
    rootReducer: Reducer<any, any, any>;
    partialState: any;
};

export const initPreloadedState = ({ rootReducer, partialState }: InitPreloadedStateParams) =>
    mergeDeepObject.withOptions(
        { mergeArrays: false },
        rootReducer(undefined, { type: 'test-init' }),
        partialState,
    );

/**
 * A Redux store for testing async action creators and middleware.
 *
 * `extra` is required so every test declares its thunk dependencies. Pass `undefined` when the
 * tested code has none.
 *
 * @deprecated This is a low-level internal utility. Use `createTestCompositionRoot` for application
 * tests. Call `createTestStore` directly only in special cases that intentionally test store or
 * middleware infrastructure without an application composition root.
 */
export function createTestStore<Extra, S = any, A extends UnknownAction = UnknownAction>({
    middleware = [],
    extra,
    reducer = (state: any) => state,
    preloadedState,
    serializableCheck = {},
}: CreateTestStoreParams<S, A, Extra>) {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        actions.push(action as A);

        return next(action);
    });

    const store = configureStore({
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: extra,
                },
                serializableCheck,
            })
                .concat([actionLoggerMiddleware])
                .concat(middleware as RTKMiddleware[]),
        reducer,
        preloadedState,
    });

    return {
        ...store,
        dispatch: store.dispatch as ThunkDispatch<S, MockStoreExtra<Extra>, A>,
        getActions: () => actions,

        clearActions: () => {
            actions = [];
        },
    };
}

export type TestStoreResult = ReturnType<typeof createTestStore>;
