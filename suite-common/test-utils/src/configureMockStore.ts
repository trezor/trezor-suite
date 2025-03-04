import { D } from '@mobily/ts-belt';
import {
    Middleware as RTKMiddleware,
    Reducer,
    ReducersMapObject,
    configureStore,
} from '@reduxjs/toolkit';
import { ThunkDispatch } from 'redux-thunk';

import { AnyAction, ExtraDependenciesPartial, createMiddleware } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { extraDependenciesMock } from './extraDependenciesMock';

export const initPreloadedState = ({
    rootReducer,
    partialState,
}: {
    rootReducer: Reducer<any, any, any>;
    partialState: any;
}) => mergeDeepObject(partialState, rootReducer(undefined, { type: 'test-init' }));

/**
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<S = any, A extends AnyAction = AnyAction>({
    middleware = [],
    extra = {},
    reducer = (state: any) => state,
    preloadedState,
    serializableCheck = {},
}: {
    middleware?: any[];
    extra?: ExtraDependenciesPartial;
    reducer?: Reducer<S, A, {}> | ReducersMapObject<S, A, {}>;
    preloadedState?: any;
    serializableCheck?: { ignoredActions?: string[] };
} = {}) {
    let actions: A[] = [];

    const actionLoggerMiddleware = createMiddleware((action, { next }) => {
        if (
            action?.meta &&
            typeof action.meta === 'object' &&
            action.meta !== null &&
            'requestId' in action.meta
        ) {
            // requestId is generated random string, and it will break fixtures because they are static, so we remove it
            if (!('arg' in action.meta) || action.meta.arg === undefined) {
                // only requestId and requestStatus are left, remove meta completely
                actions.push(D.deleteKey(action, 'meta') as any);
            } else {
                actions.push({
                    ...action,
                    meta: {
                        ...action.meta,
                        requestId: undefined,
                        requestStatus: undefined,
                    },
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
                .concat(middleware as RTKMiddleware[]),
        reducer,
        preloadedState,
    });

    return {
        ...store,
        dispatch: store.dispatch as ThunkDispatch<S, any, A>,
        getActions: () => actions as AnyAction[],

        clearActions: () => {
            actions = [];
        },
    };
}
