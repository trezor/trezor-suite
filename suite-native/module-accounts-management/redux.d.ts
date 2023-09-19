import { AsyncThunkAction } from '@reduxjs/toolkit';

declare module 'redux' {
    export interface Dispatch {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;
    }
}
