import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { typedObjectValues } from '@trezor/utils';

import { type SuiteSyncDataRootState, WalletData } from './suiteSyncDataReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectWalletById = (
    state: SuiteSyncDataRootState,
    walletDescriptor: WalletDescriptor,
): WalletData | null => state.suiteSyncData.wallets[walletDescriptor] ?? null;

const selectAllAccountsForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (wallet === null) {
            return returnStableArrayIfEmpty<SuiteSyncAccount>();
        }

        return typedObjectValues(wallet.accounts);
    },
);

const selectAllAddressesForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (!wallet) {
            return returnStableArrayIfEmpty<SuiteSyncAddress>();
        }

        return typedObjectValues(wallet.addresses);
    },
);

const selectAllOutputsForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (!wallet) {
            return returnStableArrayIfEmpty<SuiteSyncOutput>();
        }

        return typedObjectValues(wallet.outputs);
    },
);

export const selectSuiteSyncWalletLabel = (
    state: SuiteSyncDataRootState,
    walletDescriptor: WalletDescriptor,
) => {
    const walletData = selectWalletById(state, walletDescriptor);

    return walletData?.wallet.label ?? null;
};

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
            _outputIndex: number,
            deviceStaticSessionId: StaticSessionId,
        ) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

            return selectAllOutputsForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncDataRootState, txId: string) => txId,
        (_state: SuiteSyncDataRootState, _txId: string, outputIndex: number) => outputIndex,
    ],
    (outputs, txId, outputIndex) => {
        const id = createSuiteSyncOutputId(txId, outputIndex);

        return outputs.find(output => output.id === id)?.label ?? null;
    },
);

export const selectSuiteSyncAccountLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticSessionId: StaticSessionId | null,
) => {
    if (!deviceStaticSessionId) return [];
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
    const wallet = selectWalletById(state, walletDescriptor);
    if (!wallet) return [];

    return typedObjectValues(wallet.accounts);
};

export const selectSuiteSyncAccountAddressesByAccount = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, walletDescriptor: WalletDescriptor) =>
            selectAllAddressesForWallet(state, walletDescriptor),
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
    (walletAddresses, accountDescriptor, networkSymbol) =>
        walletAddresses.filter(
            address =>
                address.accountDescriptor === accountDescriptor &&
                address.networkSymbol === networkSymbol,
        ),
);

export const findSuiteSyncAccountLabel = (params: {
    accounts: SuiteSyncAccount[];
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
}) =>
    params.accounts.find(
        account =>
            account.accountDescriptor === params.accountDescriptor &&
            account.networkSymbol === params.networkSymbol,
    );

export const selectSuiteSyncAccountLabel = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, walletDescriptor: WalletDescriptor | null) =>
            walletDescriptor ? selectAllAccountsForWallet(state, walletDescriptor) : [],
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor | null,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor | null,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
    ],
    (accountLabels, accountDescriptor, networkSymbol) =>
        findSuiteSyncAccountLabel({ accounts: accountLabels, accountDescriptor, networkSymbol })
            ?.label ?? null,
);

export const selectSuiteSyncAddressLabel = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, deviceStaticId: StaticSessionId) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

            return selectAllAddressesForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncDataRootState, _deviceStaticId: StaticSessionId, address: string) =>
            address,
    ],
    (walletAddresses, address) =>
        walletAddresses.find(addr => addr.address === address)?.label ?? null,
);

export const selectSuiteSyncAddressLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

    return selectAllAddressesForWallet(state, walletDescriptor);
};

export const selectSuiteSyncOutputLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

    return selectAllOutputsForWallet(state, walletDescriptor);
};
