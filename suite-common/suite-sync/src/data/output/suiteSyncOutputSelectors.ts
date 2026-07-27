import { createWeakMapSelector } from '@suite-common/redux-utils';
import { createSuiteSyncOutputId } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, TxTargetId } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import type { WalletDescriptor } from '@trezor/device-utils';
import { parseStaticSessionId } from '@trezor/device-utils';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectAllOutputsForWallet } from '../wallet/suiteSyncWalletSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectSuiteSyncOutputLabelsByAccount = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, walletDescriptor: WalletDescriptor) =>
            selectAllOutputsForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
    ],
    (outputs, accountDescriptor, networkSymbol) =>
        outputs.filter(
            output =>
                output.accountDescriptor === accountDescriptor &&
                output.networkSymbol === networkSymbol,
        ),
);

export const selectSuiteSyncOutputLabel = createMemoizedSelector(
    [
        (
            state: SuiteSyncDataRootState,
            _txId: string,
            _txOutputId: TxTargetId,
            deviceStaticSessionId: StaticSessionId,
        ) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);

            return selectAllOutputsForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncDataRootState, txId: string) => txId,
        (_state: SuiteSyncDataRootState, _txId: string, txOutputId: TxTargetId) => txOutputId,
    ],
    (outputs, txId, txOutputId) => {
        const id = createSuiteSyncOutputId(txId, txOutputId);

        return outputs.find(output => output.id === id)?.label ?? null;
    },
);

export const selectSuiteSyncOutputLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
) => {
    const { walletDescriptor } = parseStaticSessionId(deviceStaticId);

    return selectAllOutputsForWallet(state, walletDescriptor);
};
