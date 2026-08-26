import { type AsyncThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import { compose } from 'redux';
import type { ThunkAction } from 'redux-thunk';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
        electronFind: {
            onShow: (callback: () => void) => void;
            offShow: (callback: () => void) => void;
        };
    }
}

declare module 'redux' {
    // Overload Redux dispatch with the thunk shapes used by Suite.
    export interface Dispatch<A extends Action = UnknownAction> {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;
    }
}

export {};
