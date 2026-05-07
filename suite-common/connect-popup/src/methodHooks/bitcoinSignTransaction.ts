import { type Bip43Path, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    accountsActions,
    selectAccountForNetworkSymbolAndPath,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type Account, type FormOptions } from '@suite-common/wallet-types';
import type { CallMethodKeys, SignTransaction } from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: extract pathUtils to a shared location and remove this exception (see #27376 deferred work)
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';

import { connectPopupActions } from '../connectPopupActions';
import { type PostCallHookParams, type PreCallHookParams } from './types';
import { createPlaceholderAccount } from './utils';

const temporaryAccounts: Account[] = [];

const preCallHook = async <M extends CallMethodKeys>({
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
                options.push('bitcoinLocktime');
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
                        bitcoinLocktimeBlockHeight: '',
                        bitcoinLocktimeDatetime: '',
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

export function postCallHook<M extends CallMethodKeys>({ dispatch }: PostCallHookParams<M>) {
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
