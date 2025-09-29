import { ThpState } from './thpReducer';

export type WithThpState = {
    thp: ThpState;
};

export const selectIsThpInProgress = (state: WithThpState) => state.thp.step !== null;

export const selectThpStep = (state: WithThpState) => state.thp.step;

/**
 * @deprecated This is hack, until we implement it properly.
 * @see: https://github.com/trezor/trezor-suite/pull/21960
 */
export const selectThpStepDevicePath = (state: WithThpState) => state.thp.stepDevicePath;

export const selectThpCredentials = (state: WithThpState) => state.thp.credentials;
