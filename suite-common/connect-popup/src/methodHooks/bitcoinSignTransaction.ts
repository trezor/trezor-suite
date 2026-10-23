import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectAccountForNetworkSymbolAndPath, sendFormActions } from '@suite-common/wallet-core';
import { type FormOptions } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import type { CallMethodKeys, SignTransaction } from '@trezor/connect';
import { getOriginalTxids, getPreviousTxids, getSerializedPath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { connectPopupActions } from '../connectPopupActions';
import { type PostCallHookParams, type PreCallHookParams } from './types';
import { createPlaceholderAccount, createTemporaryAccountsRegistry } from './utils';

const temporaryAccounts = createTemporaryAccountsRegistry();

const fetchRefTransactions = async (payload: SignTransaction) => {
    const { coin, refTxs, account, inputs, outputs, identity, version } = payload;

    if (!refTxs?.length && !account?.transactions?.length) {
        const prevTxids = getPreviousTxids(inputs, coin, { version });
        const origTxids = getOriginalTxids(inputs, outputs);
        const txs = [...prevTxids, ...origTxids];

        if (!txs.length) {
            return;
        }

        const hexOnly = true;
        const res = await TrezorConnect.blockchainGetTransactions({ coin, txs, identity, hexOnly });

        if (res.success) {
            return res.payload;
        }
    }
};

const preCallHook = async <M extends CallMethodKeys>({
    method,
    payload,
    getState,
    dispatch,
    txSigningPrecomposed,
}: PreCallHookParams<M>) => {
    if (method !== 'signTransaction') {
        return undefined;
    }

    const typedPayload = payload as any as SignTransaction;

    // Not awaited yet so it can run in parallel
    const refTransactionsPromise = fetchRefTransactions(typedPayload).catch(error => {
        console.error(`Error in Connect Popup ${method} hook:`, error);
    });

    try {
        if (txSigningPrecomposed) {
            const network = getNetwork(typedPayload.coin as NetworkSymbol);
            if (!network) {
                throw new Error(`Network not supported`);
            }
            const accountPath = txSigningPrecomposed.inputs.find(i => i.address_n);
            if (!accountPath?.address_n) {
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
                const createdAccount = await dispatch(
                    createPlaceholderAccount(
                        network,
                        path,
                        selectSupportedNetworkSymbols(getState()),
                    ),
                );
                temporaryAccounts.track(createdAccount.payload.account);
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

    const transactions = await refTransactionsPromise;

    return {
        ...typedPayload,
        push: false,
        account: transactions ? { ...typedPayload.account, transactions } : typedPayload.account,
    } as unknown as typeof payload;
};

export function postCallHook<M extends CallMethodKeys>({ dispatch }: PostCallHookParams<M>) {
    temporaryAccounts.cleanup(dispatch);

    return false;
}

export const bitcoinSignTransaction = {
    preCallHook,
    postCallHook,
};
