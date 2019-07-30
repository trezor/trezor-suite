import * as redux from 'redux';
// TODO: follow bug in redux-thunk types: https://github.com/reduxjs/redux-thunk/pull/224

// import TrezorConncet from 'trezor-connect';

// TODO: no types are complete at the moment for trezor-connect, so ignore it entirely.
// declare module 'trezor-connect' {
//     const x: any;

//     export = x;
// }
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
            : M[N];
    };
}

declare global {
    interface Window {
        TrezorConnect: TrezorConncet;
        __TREZOR_CONNECT_SRC: string;
        devToolsExtension: any;
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
    }
}

declare const LOCAL: string;
