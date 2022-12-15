import { configureStore } from '@reduxjs/toolkit';
import {
    Action,
    AnyAction,
    CombinedState,
    Middleware,
    PreloadedState,
    Reducer,
    ReducersMapObject,
} from 'redux';
import { D } from '@mobily/ts-belt';

import { createMiddleware, ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { extraDependenciesMock } from './extraDependenciesMock';

/**
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<S = any, A extends Action = AnyAction>({
    middleware = [],
    extra = {},
    reducer = (state: any) => state,
    preloadedState,
}: {
    middleware?: Middleware[];
    extra?: ExtraDependenciesPartial;
    reducer?: Reducer<S, A> | ReducersMapObject<S, A>;
    preloadedState?: PreloadedState<CombinedState<S>>;
} = {}) {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        if (action?.meta?.requestId) {
            // requestId is generated random string, and it will break fixtures because they are static, so we remove it
            if (action?.meta?.arg === undefined) {
                // only requestId and requestStatus are left, remove meta completely
                actions.push(D.deleteKey(action, 'meta') as any);
            } else {
                actions.push({
                    ...action,
                    meta: D.deleteKeys(action.meta, ['requestId', 'requestStatus']),
                } as any);
            }
        } else {
            actions.push(action as any);
        }

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
