import { selectSelectedDevice } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAccountForNetworkSymbolAndPath, sendFormActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import type { CallMethodKeys, SolanaSignTransaction } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { type PostCallHookParams, type PreCallHookParams } from './types';
import { createPlaceholderAccount, createTemporaryAccountsRegistry } from './utils';

const temporaryAccounts = createTemporaryAccountsRegistry();

const preCallHook = async <M extends CallMethodKeys>({
    method,
    payload,
    getState,
    dispatch,
    txSigningPrecomposed,
    source,
}: PreCallHookParams<M>) => {
    try {
        if (method === 'solanaSignTransaction') {
            const typedPayload = payload as any as SolanaSignTransaction;
            const path = getSerializedPath(validatePath(typedPayload.path)) as Bip43Path;
            const network = getNetwork(typedPayload.additionalInfo?.isDevnet ? 'dsol' : 'sol');
            // Try to find matching account
            let selectedAccount = selectAccountForNetworkSymbolAndPath(
                getState(),
                network.symbol,
                path,
            );
            if (!selectedAccount) {
                // Create a new placeholder account
                const createdAccount = await dispatch(createPlaceholderAccount(network, path));
                temporaryAccounts.track(createdAccount.payload);
                selectedAccount = createdAccount.payload;
            }
            if (!selectedAccount) {
                throw new Error('Selected account is missing'); // Should not happen
            }
            dispatch(
                connectPopupActions.setSelectedAccountKey({
                    selectedAccountKey: selectedAccount.key,
                }),
            );
            // Connect only precomposes when it can decode the message; the simulation does not
            // depend on it, so a WalletConnect call still gets scanned without one.
            if (txSigningPrecomposed) {
                dispatch(
                    sendFormActions.storePrecomposedTransaction({
                        formState: {
                            // Can be left empty, not used in tx review modal
                            outputs: [],
                            feeLimit: '',
                            feePerUnit: '',
                            selectedUtxos: [],
                            isCoinControlEnabled: false,
                            hasCoinControlBeenOpened: false,
                            options: [],
                            selectedFee: 'custom',
                        },
                        precomposedTransaction: txSigningPrecomposed,
                    }),
                );
            }

            if (source.type !== 'desktop-ws' && source.type !== 'web') {
                // Display simulation
                const device = selectSelectedDevice(getState());
                if (!device) throw new Error('No device selected');
                const accountAddress = await TrezorConnect.solanaGetAddress({
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
        }
    } catch (error) {
        // If an error occurs it's not a problem, we just fall back to generic UI
        console.error(`Error in Connect Popup ${method} hook:`, error);
        if (error.code === 'Method_Cancel') {
            // User cancelled the operation
            throw error;
        }
    }
};

export function postCallHook<M extends CallMethodKeys>({ dispatch }: PostCallHookParams<M>) {
    temporaryAccounts.cleanup(dispatch);

    return false;
}

export const solanaSignTransaction = {
    preCallHook,
    postCallHook,
};
