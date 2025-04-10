import { Bip43Path, NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    accountsActions,
    selectAccountForNetworkSymbolAndPath,
    sendFormActions,
} from '@suite-common/wallet-core';
import { Account, FormOptions } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import type { SignTransaction } from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';

import { connectPopupActions } from '../connectPopupActions';
import { createPlaceholderAccount } from './utils';

import { PostCallHookParams, PreCallHookParams } from './index';

const temporaryAccounts: Account[] = [];

const preCallHook = async <M extends keyof typeof TrezorConnect>({
    method,
    payload,
    getState,
    dispatch,
    txSigningPrecomposed,
}: PreCallHookParams<M>) => {
    try {
        if (method === 'signTransaction' && txSigningPrecomposed) {
            const typedPayload = payload as any as SignTransaction;
            const network = getNetwork(typedPayload.coin as NetworkSymbol);
            if (!network) {
                throw new Error(`Network not supported`);
            }
            const accountPath = txSigningPrecomposed.inputs.find(i => i.address_n);
            if (!accountPath || !accountPath.address_n) {
                throw new Error('Account not found in inputs');
            }
            const path = getSerializedPath(accountPath.address_n.slice(0, 3)) as Bip43Path;
            // Try to find matching account
            let selectedAccount = selectAccountForNetworkSymbolAndPath(
                getState(),
                network.symbol,
                path,
            );
            if (!selectedAccount) {
                // Create a new placeholder account
                const createdAccount = await dispatch(createPlaceholderAccount(network, path));
                temporaryAccounts.push(createdAccount.payload);
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
            // Send form options
            const options: FormOptions[] = [];
            if (typedPayload.push) {
                options.push('broadcast');
            }
            if (typedPayload.locktime) {
                options.push('bitcoinLockTime');
            }
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
                        selectedFee: 'custom',
                        options,
                        bitcoinLockTime: typedPayload.locktime?.toString(),
                    },
                    precomposedTransaction: txSigningPrecomposed,
                }),
            );
        }
    } catch (error) {
        // If an error occurs it's not a problem, we just fall back to generic UI
        console.error(`Error in Connect Popup ${method} hook:`, error);
    }
};

export function postCallHook<M extends keyof typeof TrezorConnect>({
    dispatch,
}: PostCallHookParams<M>) {
    if (temporaryAccounts.length) {
        // Remove temporary accounts
        dispatch(accountsActions.removeAccount(temporaryAccounts));
        temporaryAccounts.length = 0;
    }

    return false;
}

export const bitcoinSignTransaction = {
    preCallHook,
    postCallHook,
};
