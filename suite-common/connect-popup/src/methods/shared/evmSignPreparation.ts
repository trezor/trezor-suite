import { selectSelectedDevice } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { asNetworkSymbol, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import { accountsActions, selectAccountForNetworkSymbolAndPath } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { type DerivationPath } from '@trezor/connect';
import type { Bip43Path } from '@trezor/crypto-utils';

import { connectPopupActions } from '../../connectPopupActions';
import { getPermissionDeferred } from '../../connectPopupPromiseManager';
import { type PreCallParams } from '../types';
import { createPlaceholderAccount } from './placeholderAccount';

type EvmSignMethod = 'ethereumSignTransaction' | 'ethereumSignTypedData';

type PrepareEvmSigningAccountParams = Pick<
    PreCallParams<EvmSignMethod>,
    'dispatch' | 'getState' | 'onCleanup'
> & {
    path: Bip43Path;
    chainId: number;
};

type ShowEvmTxSimulationParams = Pick<
    PreCallParams<EvmSignMethod>,
    'dispatch' | 'getState' | 'source'
> & {
    path: DerivationPath;
    isSimulationSupported: boolean;
};

// Selects the signing account for the review, a placeholder one when Suite does not have it.
export const prepareEvmSigningAccount = async ({
    path,
    chainId,
    dispatch,
    getState,
    onCleanup,
}: PrepareEvmSigningAccountParams): Promise<Account> => {
    const network = getNetworkByEvmChainId(chainId) || {
        // Placeholder for chains not supported in Suite
        networkType: 'ethereum',
        symbol: asNetworkSymbol('eth'),
        name: 'Chain ID: ' + chainId,
        isHidden: true,
    };
    // Try to find matching account
    let selectedAccount = !network.isHidden
        ? selectAccountForNetworkSymbolAndPath(getState(), network.symbol, path)
        : null;
    if (!selectedAccount) {
        // Create a new placeholder account
        const createdAccount = await dispatch(
            createPlaceholderAccount(network, path, selectSupportedNetworkSymbols(getState())),
        );
        onCleanup(() => dispatch(accountsActions.removeAccount([createdAccount.payload.account])));
        selectedAccount = createdAccount.payload.account;
    }
    if (!selectedAccount) {
        throw new Error('Selected account is missing'); // Should not happen
    }
    dispatch(
        connectPopupActions.setSelectedAccountKey({
            selectedAccountKey: selectedAccount.key,
        }),
    );

    return selectedAccount;
};

export const showEvmTxSimulation = async ({
    path,
    isSimulationSupported,
    source,
    dispatch,
    getState,
}: ShowEvmTxSimulationParams) => {
    // The simulation modal has nothing to render for a chain Blockaid can't scan, so opening it
    // would leave the call waiting on a confirmation the user never sees. Decided from the raw
    // payload, as the simulation is, not from the defaulted chainId.
    if (source.type !== 'desktop-ws' && source.type !== 'web' && isSimulationSupported) {
        // Display simulation
        const device = selectSelectedDevice(getState());
        if (!device) throw new Error('No device selected');
        const accountAddress = await TrezorConnect.ethereumGetAddress({
            path,
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            showOnTrezor: false,
        });
        if (!accountAddress.success) throw new Error(accountAddress.error.message);
        dispatch(
            connectPopupActions.txSimulation({
                fromAddress: accountAddress.payload.address,
            }),
        );
        await getPermissionDeferred(true).promise;
    }
};
