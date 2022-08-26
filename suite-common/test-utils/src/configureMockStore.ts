import { configureStore } from '@reduxjs/toolkit';
import {
    Action,
    AnyAction,
    CombinedState,
    combineReducers,
    Middleware,
    PreloadedState,
    Reducer,
    ReducersMapObject,
} from 'redux';

import { createMiddleware, ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { mergeObject as mergeDeepObject } from '@trezor/utils';

import { extraDependenciesMock } from './extraDependenciesMock';

/**
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<S = any, A extends Action = AnyAction>({
    middleware = [],
    extra = {},
    reducer = combineReducers<any>({}),
    preloadedState,
}: {
    middleware?: Middleware[];
    extra?: ExtraDependenciesPartial;
    reducer?: Reducer<S, A> | ReducersMapObject<S, A>;
    preloadedState?: PreloadedState<CombinedState<S>>;
} = {}) {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        actions.push(action as any);

        return next(action);
    });

    const store = configureStore({
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: mergeDeepObject(extraDependenciesMock, extra),
                },
            })
                .concat([actionLoggerMiddleware])
                .concat(middleware),
        reducer,
        preloadedState,
    });

    return {
        ...store,
        getActions: () => actions,

        clearActions: () => {
            actions = [];
        },
    };
}
