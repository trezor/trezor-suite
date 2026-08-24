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

import { type ExtraDependencies } from '@suite-common/redux-extra-dependencies';
import { createMiddleware } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { extraDependenciesCommonMock } from './extraDependenciesCommonMock';

/*
 * This function is useful, because a lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = <Action extends UnknownAction>(actions: Action[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));

type ExtraDependenciesPartial = {
    [K in keyof ExtraDependencies]?: Partial<ExtraDependencies[K]>;
};

type MockStoreConfig<
    S = any,
    A extends UnknownAction = UnknownAction,
    Extra = ExtraDependenciesPartial,
> = {
    middleware?: any[];
    extra?: Extra;
    // The third generic (PreloadedState) sits in a contravariant position in redux's Reducer
    // signature, so neither `unknown` nor `Record<string, never>` work as drop-in replacements
    // for `{}` here — both reject test fixtures that pass a Partial<S> as preloaded state.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    reducer?: Reducer<S, A, {}> | ReducersMapObject<S, A, {}>;
    preloadedState?: any;
    serializableCheck?: { ignoredActions?: string[] };
};

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
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<
    S = any,
    A extends UnknownAction = UnknownAction,
    Extra = ExtraDependenciesPartial,
>({
    middleware = [],
    extra,
    reducer = (state: any) => state,
    preloadedState,
    serializableCheck = {},
}: MockStoreConfig<S, A, Extra> = {}) {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        actions.push(action as A);

        return next(action);
    });

    const store = configureStore({
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: mergeDeepObject(extraDependenciesCommonMock, extra ?? {}),
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
        dispatch: store.dispatch as ThunkDispatch<S, any, A>,
        getActions: () => actions,

        clearActions: () => {
            actions = [];
        },
    };
}
