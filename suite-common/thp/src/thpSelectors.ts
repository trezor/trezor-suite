import { ThpState } from './thpReducer';

export type ThpRootState = {
    thp: ThpState;
};

export const selectThp = (state: ThpRootState) => state.thp;

export const selectIsThpInProgress = (state: ThpRootState) => state.thp.step !== null;

export const selectThpStep = (state: ThpRootState) => state.thp.step;

export const selectThpLastResult = (state: ThpRootState) => state.thp.lastResult;

export const selectThpCredentials = (state: ThpRootState) => state.thp.credentials;
