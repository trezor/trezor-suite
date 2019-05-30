import * as redux from 'redux';
// TODO: follow bug in redux-thunk types: https://github.com/reduxjs/redux-thunk/pull/224
declare module 'redux' {
    /**
     * Overload for bindActionCreators redux function, returns expects responses
     * from thunk actions
     */
    function bindActionCreators<M extends ActionCreatorsMapObject<any>>(
        actionCreators: M,
        dispatch: Dispatch,
    ): {
        [N in keyof M]: ReturnType<M[N]> extends ThunkAction<any, any, any, any>
            ? (...args: Parameters<M[N]>) => ReturnType<ReturnType<M[N]>>
            : M[N]
    };
}

declare global {
    interface Window {
        mozIndexedDB: IDBDatabase | null;
        webkitIndexedDB: IDBDatabase | null;
        msIndexedDB: IDBDatabase | null;
        shimIndexedDB: IDBDatabase | null;
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
    }
}
