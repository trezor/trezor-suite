import { selectSelectedDevice } from '@suite-common/device';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAccountForNetworkSymbolAndPath } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { createPlaceholderAccount } from './shared/placeholderAccount';
import { createTemporaryAccountsRegistry } from './shared/temporaryAccountsRegistry';
import {
    type ConnectPopupMethodDefinition,
    type PostCallParams,
    type PreCallParams,
} from './types';

const temporaryAccounts = createTemporaryAccountsRegistry();

const preCall = async ({
    method,
    payload,
    getState,
    dispatch,
    source,
}: PreCallParams<'stellarSignTransaction'>): Promise<undefined> => {
    try {
        // Only the XDR form can be scanned; structured operations would need re-encoding first.
        if (!('xdrBase64' in payload)) {
            return;
        }

        const path = getSerializedPath(validatePath(payload.path)) as Bip43Path;
        const network = getNetwork(payload.testnet ? 'txlm' : 'xlm');

        let selectedAccount = selectAccountForNetworkSymbolAndPath(
            getState(),
            network.symbol,
            path,
        );
        if (!selectedAccount) {
            const createdAccount = await dispatch(
                createPlaceholderAccount(network, path, selectSupportedNetworkSymbols(getState())),
            );
            temporaryAccounts.track(createdAccount.payload.account);
            selectedAccount = createdAccount.payload.account;
        }
        if (!selectedAccount) {
            throw new Error('Selected account is missing');
        }
        dispatch(
            connectPopupActions.setSelectedAccountKey({
                selectedAccountKey: selectedAccount.key,
            }),
        );

        if (source.type !== 'desktop-ws' && source.type !== 'web') {
            const device = selectSelectedDevice(getState());
            if (!device) throw new Error('No device selected');
            const accountAddress = await TrezorConnect.stellarGetAddress({
                path: payload.path,
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
    } catch (error) {
        // If an error occurs it's not a problem, we just fall back to generic UI
        console.error(`Error in Connect Popup ${method} hook:`, error);
        if (error.code === 'Method_Cancel') {
            throw error;
        }
    }
};

const postCall = ({ dispatch }: PostCallParams<'stellarSignTransaction'>) => {
    temporaryAccounts.cleanup(dispatch);

    return false;
};

export const stellarSignTransaction: ConnectPopupMethodDefinition<'stellarSignTransaction'> = {
    preCall,
    postCall,
};
