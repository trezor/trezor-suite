import {
    type Middleware as RTKMiddleware,
    type Reducer,
    type ReducersMapObject,
    type Store,
    type UnknownAction,
    configureStore,
    isFulfilled,
    isPending,
} from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { createMiddleware, createReduxExtra } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

/*
 * This function is useful, because a lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = <Action extends UnknownAction>(actions: Action[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));

// Static (non-service) thunk extra, e.g. `thunks` or `actions`. Services are injected separately.
type TestStoreExtraDependencies<Extra> = Omit<Extra, 'services'>;

// A contract without `services`, including `void`, declares that no services are injected.
export type TestStoreServices<Extra> = 0 extends 1 & Extra
    ? any
    : Extra extends { services: infer TServices }
      ? TServices
      : Record<never, never>;

// Thunks receive the composed `extra`, so dispatch checks them against that shape. A `void` contract
// still hands thunks an object with (empty) services.
type TestStoreDispatchExtra<Extra> = 0 extends 1 & Extra ? any : TestStoreExtra<Extra>;

export type TestReduxStore<S, A extends UnknownAction, Extra> = Omit<Store<S, A>, 'dispatch'> & {
    dispatch: ThunkDispatch<S, TestStoreDispatchExtra<Extra>, A>;
    getActions: () => A[];
    clearActions: () => void;
};

export type TestStoreExtra<Extra> = TestStoreExtraDependencies<Extra> & {
    services: TestStoreServices<Extra>;
};

type TestStoreResult<S, A extends UnknownAction, Extra> = {
    store: TestReduxStore<S, A, Extra>;
    injectServicesIntoReduxExtra: (services: TestStoreServices<Extra>) => void;
    getExtra: () => TestStoreExtra<Extra>;
};

export type CreateTestStoreParams<S, A extends UnknownAction, Extra> = {
    middleware?: any[];
    // The third generic (PreloadedState) is what the reducer must accept besides its own state.
    // `S` lets a hand-written `(state = preloadedState, action) => ...` read `state` as `S`, while
    // `combineReducers` reducers, which also accept a partial state, still fit.
    reducer?: Reducer<S, A, S> | ReducersMapObject<S, A, S>;
    preloadedState?: any;
    serializableCheck?: { ignoredActions?: string[] };
} & (Record<never, never> extends TestStoreExtraDependencies<Extra>
    ? { extra?: TestStoreExtraDependencies<Extra> }
    : { extra: TestStoreExtraDependencies<Extra> });

export const initPreloadedState = ({
    rootReducer,
    partialState,
}: {
    rootReducer: Reducer<any, any, any>;
    partialState: any;
}) =>
    mergeDeepObject.withOptions(
        { mergeArrays: false },
        rootReducer(undefined, { type: 'test-init' }),
        partialState,
    );

/**
 * A Redux store for testing async action creators and middleware.
 *
 * It is wired like the application store: thunks read their `extra` lazily, and services are
 * injected explicitly with `injectServicesIntoReduxExtra` once they are composed next to the store,
 * e.g. `injectServicesIntoReduxExtra({ analytics: mockAnalytics(), store })`. Dispatching a thunk
 * before the services are injected throws, exactly like in the application.
 *
 * Declare the thunk dependency contract as the first type argument, so the injected services and
 * the static `extra` are type-checked against it.
 *
 * @internal Tests compose through `createTestCompositionRoot`; this is not exported from the package.
 */
export function createTestStore<Extra = any, S = any, A extends UnknownAction = UnknownAction>(
    {
        middleware = [],
        extra,
        reducer = (state: any) => state,
        preloadedState,
        serializableCheck = {},
    }: CreateTestStoreParams<S, A, Extra> = {} as CreateTestStoreParams<S, A, Extra>,
): TestStoreResult<S, A, Extra> {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        actions.push(action as A);

        return next(action);
    });

    const { getExtra, thunkMiddleware, injectServicesIntoReduxExtra } = createReduxExtra<
        S,
        TestStoreServices<Extra>,
        TestStoreExtraDependencies<Extra>
    >({ extraDependencies: extra ?? ({} as TestStoreExtraDependencies<Extra>) });

    const store = configureStore({
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: false,
                serializableCheck,
            })
                .prepend(thunkMiddleware)
                .concat([actionLoggerMiddleware])
                .concat(middleware as RTKMiddleware[]),
        reducer,
        preloadedState,
    });

    return {
        store: {
            ...store,
            dispatch: store.dispatch as ThunkDispatch<S, TestStoreDispatchExtra<Extra>, A>,
            getActions: () => actions,

            clearActions: () => {
                actions = [];
            },
        },
        injectServicesIntoReduxExtra,
        getExtra,
    };
}
