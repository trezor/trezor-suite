import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type SuiteSyncOutput, createSuiteSyncOutputId } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, TxTargetId, WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';

import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
} from '../../suiteSyncSelectors';
import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectAllOutputsForWallet } from '../wallet/suiteSyncWalletSelectors';

type SuiteSyncOutputRootState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncOutputRootState>();

export const selectSuiteSyncOutputLabelsByAccount = createMemoizedSelector(
    [
        (state: SuiteSyncOutputRootState, walletDescriptor: WalletDescriptor) =>
            selectAllOutputsForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncOutputRootState,
            _walletDescriptor: WalletDescriptor,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncOutputRootState,
            _walletDescriptor: WalletDescriptor,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
        selectIsSuiteSyncEnabled,
    ],
    (outputs, accountDescriptor, networkSymbol, isSuiteSyncEnabled) => {
        if (!isSuiteSyncEnabled) {
            return returnStableArrayIfEmpty<SuiteSyncOutput>();
        }

        return returnStableArrayIfEmpty(
            outputs.filter(
                output =>
                    output.accountDescriptor === accountDescriptor &&
                    output.networkSymbol === networkSymbol,
            ),
        );
    },
);

export const selectSuiteSyncOutputLabel = createMemoizedSelector(
    [
        (
            state: SuiteSyncOutputRootState,
            _txId: string,
            _txOutputId: TxTargetId,
            deviceStaticSessionId: StaticSessionId,
        ) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

            return selectAllOutputsForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncOutputRootState, txId: string) => txId,
        (_state: SuiteSyncOutputRootState, _txId: string, txOutputId: TxTargetId) => txOutputId,
        selectIsSuiteSyncEnabled,
    ],
    (outputs, txId, txOutputId, isSuiteSyncEnabled) => {
        if (!isSuiteSyncEnabled) return null;

        const id = createSuiteSyncOutputId(txId, txOutputId);

        return outputs.find(output => output.id === id)?.label ?? null;
    },
);

export const selectSuiteSyncOutputLabels = (
    state: SuiteSyncOutputRootState,
    deviceStaticId: StaticSessionId,
) => {
    if (!selectIsSuiteSyncEnabled(state)) {
        return returnStableArrayIfEmpty<SuiteSyncOutput>();
    }

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

    return selectAllOutputsForWallet(state, walletDescriptor);
};
