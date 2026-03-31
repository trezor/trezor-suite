import { type ThpState } from './thpReducer';

export type ThpRootState = {
    thp: ThpState;
};

export const selectThp = (state: ThpRootState) => state.thp;

export const selectIsThpInProgress = (state: ThpRootState) => state.thp.step !== null;

export const selectThpStep = (state: ThpRootState) => state.thp.step;

export const selectThpAutoconnectStep = (state: ThpRootState) => state.thp.autoconnectStep;

export const selectThpLastCode = (state: ThpRootState) => state.thp.lastThpCode;

export const selectThpCredentials = (state: ThpRootState) => state.thp.credentials;

export const selectThpPairingRequestId = (state: ThpRootState) => state.thp.pairingRequestId;
