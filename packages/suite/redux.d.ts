import { AsyncThunkAction, ThunkAction } from '@reduxjs/toolkit';
import type { Action } from 'redux';

import type { AnyAction } from '@suite-common/redux-utils';

declare module '@reduxjs/toolkit' {
    export type AnyAction = import('@suite-common/redux-utils').AnyAction;
}

declare module 'redux' {
    export interface Dispatch<A extends Action = AnyAction> {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;
    }
}
