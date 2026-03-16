import { D } from '@mobily/ts-belt';
import {
    type Middleware as RTKMiddleware,
    type Reducer,
    type ReducersMapObject,
    configureStore,
} from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import {
    type AnyAction,
    type ExtraDependenciesPartial,
    createMiddleware,
} from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { extraDependenciesCommonMock } from './extraDependenciesCommonMock';

export type MockStoreConfig<S = any, A extends AnyAction = AnyAction> = {
    middleware?: any[];
    extra?: ExtraDependenciesPartial;
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
export function configureMockStore<S = any, A extends AnyAction = AnyAction>({
    middleware = [],
    extra = {},
    reducer = (state: any) => state,
    preloadedState,
    serializableCheck = {},
}: MockStoreConfig<S, A> = {}) {
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
                    extraArgument: mergeDeepObject(extraDependenciesCommonMock, extra),
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
