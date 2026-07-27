import { type Reducer } from '@reduxjs/toolkit';

export const createStaticReducer =
    <State>(initialState: State): Reducer<State> =>
    (state = initialState) =>
        state;
