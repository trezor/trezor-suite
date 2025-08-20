import { ThpState } from './thpReducer';

export type WithThpState = {
    thp: ThpState;
};

export const selectIsThpInProgress = (state: WithThpState) => state.thp.step !== null;

export const selectThpStep = (state: WithThpState) => state.thp.step;

export const selectThpCredentials = (state: WithThpState) => state.thp.credentials;
