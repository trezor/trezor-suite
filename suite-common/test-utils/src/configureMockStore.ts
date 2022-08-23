/* eslint-disable @typescript-eslint/ban-types */
import {
    Action,
    AnyAction,
    applyMiddleware,
    DeepPartial,
    Middleware,
    Observable,
    Reducer,
    Store,
    StoreEnhancerStoreCreator,
    Unsubscribe,
} from 'redux';
import thunk from 'redux-thunk';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { mergeObject as mergeDeepObject } from '@trezor/utils';

import { extraDependenciesMock } from './extraDependenciesMock';

function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}

function isPlainObject(value: any): boolean {
    return (
        Object.prototype.toString.call(value) === '[object Object]' &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

/**
 * A mock store for testing Redux async action creators and middleware.
 */
export function configureMockStore<
    S = any,
    A extends Action = AnyAction,
    DispatchExts extends {} | void = void,
>({
    middlewares = [],
    extra = {},
}: {
    middlewares?: Middleware[];
    extra?: DeepPartial<ExtraDependencies>;
} = {}): MockStoreCreator<S, A, DispatchExts> {
    /**
     * @returns An instance of the configured mock store.
     * @note Call this function to reset your store after every test.
     */
    function mockStore(
        getState: S | MockGetState<S> = {} as S,
    ): DispatchExts extends void ? MockStore<S, A> : MockStoreEnhanced<S, A, DispatchExts> {
        function creator(): MockStore<S, A> {
            let actions: A[] = [];
            const listeners: Array<(action: A) => void> = [];

            return {
                getState() {
                    return isFunction(getState) ? getState(actions) : getState;
                },

                getActions() {
                    return actions;
                },

                clearActions() {
                    actions = [];
                },

                dispatch<T extends A>(action: T): T {
                    if (!isPlainObject(action)) {
                        throw new TypeError(
                            'Actions must be plain objects. ' +
                                'Use custom middleware for async actions.',
                        );
                    }

                    if (typeof action.type === 'undefined') {
                        throw new TypeError(
                            `Actions may not have an undefined "type" property. ` +
                                `Have you misspelled a constant? ` +
                                `Action: ${JSON.stringify(action)}`,
                        );
                    }

                    actions.push(action);

                    // eslint-disable-next-line no-restricted-syntax
                    for (const listener of listeners) {
                        listener(action);
                    }

                    return action;
                },

                subscribe(listener: (action: A) => void): Unsubscribe {
                    if (!isFunction(listener)) {
                        throw new TypeError('Listener must be a function.');
                    }

                    listeners.push(listener);

                    function unsubscribe() {
                        const index = listeners.indexOf(listener);
                        if (index === -1) {
                            return;
                        }

                        listeners.splice(index, 1);
                    }

                    return unsubscribe;
                },

                replaceReducer(_nextReducer: Reducer<S, A>): never {
                    throw new Error(
                        'Mock stores do not support reducers. ' +
                            'Try supplying a function to getStore instead.',
                    );
                },

                /* istanbul ignore next */
                [Symbol.observable](): Observable<S> {
                    throw new Error('Not implemented');
                },
            };
        }

        const thunkMiddleware = thunk.withExtraArgument(
            mergeDeepObject(extra, extraDependenciesMock),
        );

        return applyMiddleware(
            ...middlewares,
            thunkMiddleware,
        )(creator as StoreEnhancerStoreCreator<any, any>)(undefined as any) as any;
    }

    return mockStore as any;
}

export type MockStoreCreator<
    S = {},
    A extends Action = AnyAction,
    DispatchExts extends {} | void = void,
> = (
    state?: S | MockGetState<S>,
) => DispatchExts extends void ? MockStore<S, A> : MockStoreEnhanced<S, A, DispatchExts>;

export type MockGetState<S = {}> = (actions: AnyAction[]) => S;

export type MockStoreEnhanced<S, A extends Action = AnyAction, DispatchExts = {}> = MockStore<
    S,
    A
> & {
    dispatch: DispatchExts;
};

export interface MockStore<S = any, A extends Action = AnyAction> extends Store<S, A> {
    clearActions(): void;
    getActions(): A[];
    subscribe(listener: (action: A) => void): Unsubscribe;
}
