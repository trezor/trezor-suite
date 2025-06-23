import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { labelingActions } from './labelingActions';
import { findAccountLabel, findAddressLabel, findOutputLabel } from './labelingSelectors';

export type WalletLabel = {
    deviceStaticSessionId: string;
    label: string | null;
};

export type AccountLabel = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export type AddressLabel = {
    address: string;
    label: string | null;
};

export type OutputLabel = {
    txId: string;
    outputIndex: number;
    label: string | null;
};

export type LabelingState = {
    walletLabels: WalletLabel[];
    accountLabels: AccountLabel[];
    addressLabels: AddressLabel[];
    outputLabels: OutputLabel[];
};

const initialState: LabelingState = {
    walletLabels: [] as WalletLabel[],
    accountLabels: [] as AccountLabel[],
    addressLabels: [] as AddressLabel[],
    outputLabels: [] as OutputLabel[],
};

export const prepareLabelingReducer = createReducerWithExtraDeps<LabelingState>(
    initialState,
    builder =>
        builder
            .addCase(labelingActions.setWalletLabel, (state, { payload }) => {
                const existing = state.walletLabels.find(
                    it => it.deviceStaticSessionId === payload.deviceStaticSessionId,
                );

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    state.walletLabels.push(payload);
                }
            })
            .addCase(labelingActions.setAccountLabel, (state, { payload }) => {
                const existing = findAccountLabel({
                    accountLabels: state.accountLabels,
                    accountKey: payload.accountKey,
                    deviceStaticSessionId: payload.deviceStaticSessionId,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    state.accountLabels.push(payload);
                }
            })
            .addCase(labelingActions.setAddressLabel, (state, { payload }) => {
                const existing = findAddressLabel({
                    addressLabels: state.addressLabels,
                    address: payload.address,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    state.addressLabels.push(payload);
                }
            })
            .addCase(labelingActions.setOutputLabel, (state, { payload }) => {
                const existing = findOutputLabel({
                    outputLabels: state.outputLabels,
                    txId: payload.txId,
                    outputIndex: payload.outputIndex,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    state.outputLabels.push(payload);
                }
            })
            .addCase(labelingActions.clearAllLabels, state => {
                state.walletLabels = [];
                state.accountLabels = [];
                state.addressLabels = [];
                state.outputLabels = [];
            }),
);
