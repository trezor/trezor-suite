import { selectSelectedDevice } from '@suite-common/device';
import { Bip43Path, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import {
    accountsActions,
    selectAccountForNetworkSymbolAndPath,
    sendFormActions,
} from '@suite-common/wallet-core';
import { Account, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import type { CallMethodKeys, EthereumSignTransaction } from '@trezor/connect';
import { MethodInfo } from '@trezor/connect/src/core/AbstractMethod';
import { getSerializedPath, validatePath } from '@trezor/connect/src/utils/pathUtils';

import { connectPopupActions } from '../connectPopupActions';
import { createPlaceholderAccount } from './utils';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { selectConnectPopupCall } from '../connectPopupReducer';
import { PostCallHookParams, PreCallHookParams } from './types';

const temporaryAccounts: Account[] = [];

const _storePrecomposedTransaction = ({
    typedPayload,
    txSigningPrecomposed,
}: {
    typedPayload: EthereumSignTransaction;
    txSigningPrecomposed: PrecomposedTransactionFinal;
}) =>
    sendFormActions.storePrecomposedTransaction({
        formState: {
            // Can be left empty, not used in tx review modal
            outputs: [],
            feeLimit: '',
            feePerUnit: '',
            selectedUtxos: [],
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            options: ['ethereumNonce', 'transactionData'],
            selectedFee: 'custom',
            ethereumDataAscii: '',
            transactionData: typedPayload.transaction.data?.replace(/^0x/, ''),
            ethereumNonce: typedPayload.transaction.nonce,
        },
        precomposedTransaction: {
            ...txSigningPrecomposed,
        },
    });

const preCallHook = async <M extends CallMethodKeys>({
    method,
    payload,
    getState,
    dispatch,
    txSigningPrecomposed,
    source,
}: PreCallHookParams<M>) => {
    try {
        // Prepare selected account
        if (method === 'ethereumSignTransaction' && txSigningPrecomposed) {
            const typedPayload = payload as any as EthereumSignTransaction;
            const path = getSerializedPath(validatePath(typedPayload.path)) as Bip43Path;
            const network = getNetworkByEvmChainId(typedPayload.transaction.chainId || 1) || {
                // Placeholder for chains not supported in Suite
                networkType: 'ethereum',
                symbol: 'eth',
                name: 'Chain ID: ' + typedPayload.transaction.chainId,
                isHidden: true,
            };
            // Try to find matching account
            let selectedAccount = !network.isHidden
                ? selectAccountForNetworkSymbolAndPath(getState(), network.symbol, path)
                : null;
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
            dispatch(_storePrecomposedTransaction({ typedPayload, txSigningPrecomposed }));
        }

        if (
            (method === 'ethereumSignTransaction' || method === 'ethereumSignTypedData') &&
            source.type !== 'desktop-ws' &&
            source.type !== 'web'
        ) {
            // Display simulation
            const device = selectSelectedDevice(getState());
            if (!device) throw new Error('No device selected');
            const accountAddress = await TrezorConnect.ethereumGetAddress({
                path: (payload as any).path,
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

        // Modify payload to include selected fee, if present
        if (method === 'ethereumSignTransaction') {
            const currentPopupCall = selectConnectPopupCall(getState());
            const typedPayload = payload as any as EthereumSignTransaction;
            if (
                (currentPopupCall?.state === 'ongoing' ||
                    currentPopupCall?.state === 'tx-simulation') &&
                currentPopupCall?.selectedFee
            ) {
                const modifiedPayload = {
                    ...typedPayload,
                    transaction: {
                        ...typedPayload.transaction,
                        ...currentPopupCall.selectedFee,
                    },
                } satisfies EthereumSignTransaction;

                // Update precomposed transaction
                const methodInfo = await TrezorConnect.ethereumSignTransaction({
                    ...modifiedPayload,
                    __info: true,
                    __precomposed: true,
                });
                if (!methodInfo.success) {
                    throw methodInfo.error;
                }
                txSigningPrecomposed = (methodInfo.payload as any as MethodInfo).precomposed;
                if (txSigningPrecomposed)
                    dispatch(_storePrecomposedTransaction({ typedPayload, txSigningPrecomposed }));

                return modifiedPayload as any as typeof payload;
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

const postCallHook = <M extends CallMethodKeys>({ dispatch }: PostCallHookParams<M>) => {
    if (temporaryAccounts.length) {
        // Remove temporary accounts
        dispatch(accountsActions.removeAccount(temporaryAccounts));
        temporaryAccounts.length = 0;
    }

    return false;
};

export const ethereumSignTransaction = {
    preCallHook,
    postCallHook,
};
