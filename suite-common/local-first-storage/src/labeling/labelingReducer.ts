import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import type { WalletDescriptor } from '@suite-common/wallet-types';

import { AccountLabel } from './evolu/accountLabels';
import { AddressLabel } from './evolu/addressLabels';
import { OutputLabel } from './evolu/outputLabels';
import { labelingActions } from './labelingActions';
import { findAccountLabel, findAddressLabel, findOutputLabel } from './labelingSelectors';

export type WalletLabelState = {
    walletLabel: string | null;
    accountLabels: AccountLabel[];
    addressLabels: AddressLabel[];
    outputLabels: OutputLabel[];
};

export type LabelingState = {
    walletsLabels: Record<WalletDescriptor, WalletLabelState>; // key: WalletDescriptor = First btc testnet address
};

export const initialLabelingState: LabelingState = {
    walletsLabels: {},
};

const getOrCreateWalletsLabelsState = (
    state: LabelingState,
    walletDescriptor: WalletDescriptor,
) => {
    const walletLabelState = state.walletsLabels[walletDescriptor];

    if (walletLabelState === undefined) {
        state.walletsLabels[walletDescriptor] = {
            walletLabel: null,
            accountLabels: [] as AccountLabel[],
            addressLabels: [] as AddressLabel[],
            outputLabels: [] as OutputLabel[],
        };
    }

    return state.walletsLabels[walletDescriptor];
};

export const prepareLabelingReducer = createReducerWithExtraDeps<LabelingState>(
    initialLabelingState,
    builder =>
        builder
            .addCase(labelingActions.setWalletLabel, (state, { payload }) => {
                const walletLabelState = getOrCreateWalletsLabelsState(
                    state,
                    payload.walletDescriptor,
                );

                walletLabelState.walletLabel = payload.label;
            })
            .addCase(labelingActions.setAccountLabel, (state, { payload }) => {
                const walletLabelState = getOrCreateWalletsLabelsState(
                    state,
                    payload.walletDescriptor,
                );

                const existing = findAccountLabel({
                    accountLabels: walletLabelState.accountLabels,
                    accountDescriptor: payload.accountDescriptor,
                    networkSymbol: payload.networkSymbol,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    walletLabelState.accountLabels.push(payload);
                }
            })
            .addCase(labelingActions.setAddressLabel, (state, { payload }) => {
                const walletLabelState = getOrCreateWalletsLabelsState(
                    state,
                    payload.walletDescriptor,
                );

                const existing = findAddressLabel({
                    addressLabels: walletLabelState.addressLabels,
                    address: payload.address,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    walletLabelState.addressLabels.push(payload);
                }
            })
            .addCase(labelingActions.setOutputLabel, (state, { payload }) => {
                const walletLabelState = getOrCreateWalletsLabelsState(
                    state,
                    payload.walletDescriptor,
                );

                const existing = findOutputLabel({
                    outputLabels: walletLabelState.outputLabels,
                    txId: payload.txId,
                    outputIndex: payload.outputIndex,
                });

                if (existing !== undefined) {
                    existing.label = payload.label;
                } else {
                    walletLabelState.outputLabels.push(payload);
                }
            })
            .addCase(labelingActions.clearAllLabels, (state, { payload }) => {
                delete state.walletsLabels[payload.walletDescriptor];
            }),
);
