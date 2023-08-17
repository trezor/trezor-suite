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
import { ThunkDispatch } from 'redux-thunk';

import { createMiddleware, ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { extraDependenciesMock } from './extraDependenciesMock';

export const initPreloadedState = ({
    rootReducer,
    partialState,
}: {
    rootReducer: Reducer<any, any>;
    partialState: PreloadedState<CombinedState<any>>;
}) => mergeDeepObject(partialState, rootReducer(undefined, { type: 'test-init' }));

/**
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<S = any, A extends Action = AnyAction>({
    middleware = [],
    extra = {},
    reducer = (state: any) => state,
    preloadedState,
    serializableCheck = {},
}: {
    middleware?: Middleware[];
    extra?: ExtraDependenciesPartial;
    reducer?: Reducer<S, A> | ReducersMapObject<S, A>;
    preloadedState?: PreloadedState<CombinedState<S>>;
    serializableCheck?: { ignoredActions?: string[] };
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
                serializableCheck,
            })
                .concat([actionLoggerMiddleware])
                .concat(middleware),
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
