import { type ThpHostNameDep } from '@suite-common/suite-types';
import { type ThpSettings } from '@trezor/connect';
import { type Getter } from '@trezor/dependency-injection';

import { type ThpState } from './thpReducer';

export type GetThpSettingsDep = {
    getThpSettings: Getter<[], ThpSettings>;
};

export type { ThpHostNameDep };

export type ThpRootState = {
    thp: ThpState;
};

export const selectThp = (state: ThpRootState) => state.thp;

export const selectThpStep = (state: ThpRootState) => state.thp.step;

export const selectIsThpInProgress = (state: ThpRootState) => selectThpStep(state) !== null;

export const selectThpAutoconnectStep = (state: ThpRootState) => state.thp.autoconnectStep;

export const selectThpLastCode = (state: ThpRootState) => state.thp.lastThpCode;

export const selectThpCredentials = (state: ThpRootState) => state.thp.credentials;

export const selectThpPairingRequestId = (state: ThpRootState) => state.thp.pairingRequestId;

export const selectThpConfirmationRequestId = (state: ThpRootState) =>
    state.thp.confirmationRequestId;
