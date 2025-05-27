import { ThpState } from './thpReducer';

export type WithThpState = {
    thp: ThpState;
};

export const selectThpStep = (state: WithThpState) => state.thp.step;

export const selectThpCredentials = (state: WithThpState) => state.thp.credentials;

export const selectThpStaticKey = (state: WithThpState) => state.thp.staticKey;
