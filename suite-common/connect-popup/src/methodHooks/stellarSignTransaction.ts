import { selectSelectedDevice } from '@suite-common/device';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { accountsActions, selectAccountForNetworkSymbolAndPath } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import type { CallMethodKeys, StellarSignTransaction } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { type PostCallHookParams, type PreCallHookParams } from './types';
import { createPlaceholderAccount } from './utils';

const temporaryAccounts: Account[] = [];

const preCallHook = async <M extends CallMethodKeys>({
    method,
    payload,
    getState,
    dispatch,
    source,
}: PreCallHookParams<M>) => {
    try {
        if (method !== 'stellarSignTransaction') {
            return;
        }

        const typedPayload = payload as any as StellarSignTransaction;

        // Only the XDR form can be scanned; structured operations would need re-encoding first.
        if (!('xdrBase64' in typedPayload)) {
            return;
        }

        const path = getSerializedPath(validatePath(typedPayload.path)) as Bip43Path;
        const network = getNetwork(asNetworkSymbol(typedPayload.testnet ? 'txlm' : 'xlm'));

        let selectedAccount = selectAccountForNetworkSymbolAndPath(
            getState(),
            network.symbol,
            path,
        );
        if (!selectedAccount) {
            const createdAccount = await dispatch(createPlaceholderAccount(network, path));
            temporaryAccounts.push(createdAccount.payload);
            selectedAccount = createdAccount.payload;
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
                path: typedPayload.path,
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

export function postCallHook<M extends CallMethodKeys>({ dispatch }: PostCallHookParams<M>) {
    if (temporaryAccounts.length) {
        dispatch(accountsActions.removeAccount(temporaryAccounts));
        temporaryAccounts.length = 0;
    }

    return false;
}

export const stellarSignTransaction = {
    preCallHook,
    postCallHook,
};
