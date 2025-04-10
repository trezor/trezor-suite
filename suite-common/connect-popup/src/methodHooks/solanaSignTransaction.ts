import { Bip43Path, getNetwork } from '@suite-common/wallet-config';
import {
    accountsActions,
    selectAccountForNetworkSymbolAndPath,
    sendFormActions,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import type { SolanaSignTransaction } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect/src/utils/pathUtils';

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
        if (method === 'solanaSignTransaction' && txSigningPrecomposed) {
            const typedPayload = payload as any as SolanaSignTransaction;
            const path = getSerializedPath(validatePath(typedPayload.path)) as Bip43Path;
            const network = getNetwork('sol'); // solanaSignTransaction has no parameter for testnet
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

export const solanaSignTransaction = {
    preCallHook,
    postCallHook,
};
