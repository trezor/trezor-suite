import { isEvmTxSimulationSupported } from '@suite-common/tx-simulation';
import { sendFormActions } from '@suite-common/wallet-core';
import { type Account, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getPrecomposedTxWithAccountToken } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import type { EthereumSignTransaction, MethodInfo } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import { selectConnectPopupCall } from '../connectPopupReducer';
import { prepareEvmSigningAccount, showEvmTxSimulation } from './shared/evmSignPreparation';
import { type ConnectPopupMethodDefinition, type PreCallParams } from './types';

type _storePrecomposedTransactionParams = {
    typedPayload: EthereumSignTransaction;
    txSigningPrecomposed: PrecomposedTransactionFinal;
    account: Account;
};

const _storePrecomposedTransaction = ({
    typedPayload,
    txSigningPrecomposed,
    account,
}: _storePrecomposedTransactionParams) =>
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
            transactionData: typedPayload.transaction.data?.replace(/^0x/, ''),
            // The signing payload carries the nonce in hex; show it as a decimal string in the
            // review modal to match the Send flow (otherwise it renders e.g. "0x5").
            ethereumNonce: typedPayload.transaction.nonce
                ? parseInt(typedPayload.transaction.nonce, 16).toString()
                : typedPayload.transaction.nonce,
        },
        precomposedTransaction: getPrecomposedTxWithAccountToken({
            precomposedTx: txSigningPrecomposed,
            contract: typedPayload.transaction.to,
            data: typedPayload.transaction.data,
            accountTokens: account.tokens,
        }),
    });

const preCall = async ({
    method,
    payload,
    getState,
    dispatch,
    txSigningPrecomposed,
    source,
    onCleanup,
}: PreCallParams<'ethereumSignTransaction'>) => {
    try {
        const path = getSerializedPath(validatePath(payload.path)) as Bip43Path;
        const chainId = payload.transaction.chainId || 1;
        const isSimulationSupported = isEvmTxSimulationSupported({ method, payload });

        const selectedAccount = await prepareEvmSigningAccount({
            path,
            chainId,
            dispatch,
            getState,
            onCleanup,
        });

        if (txSigningPrecomposed) {
            dispatch(
                _storePrecomposedTransaction({
                    typedPayload: payload,
                    txSigningPrecomposed,
                    account: selectedAccount,
                }),
            );
        }

        await showEvmTxSimulation({
            path: payload.path,
            isSimulationSupported,
            source,
            dispatch,
            getState,
        });

        // Modify payload to include selected fee, if present
        if (source.type === 'walletconnect') {
            const currentPopupCall = selectConnectPopupCall(getState());
            if (
                (currentPopupCall?.state === 'ongoing' ||
                    currentPopupCall?.state === 'tx-simulation') &&
                currentPopupCall?.selectedFee
            ) {
                const modifiedPayload = {
                    ...payload,
                    transaction: {
                        ...payload.transaction,
                        ...currentPopupCall.selectedFee,
                    },
                } satisfies EthereumSignTransaction;

                // Update precomposed transaction
                const methodInfo = await TrezorConnect.ethereumSignTransaction({
                    ...modifiedPayload,
                    __info: true,
                });
                if (!methodInfo.success) {
                    throw methodInfo.error;
                }
                txSigningPrecomposed = (methodInfo.payload as any as MethodInfo).precomposed;
                if (txSigningPrecomposed)
                    dispatch(
                        _storePrecomposedTransaction({
                            typedPayload: payload,
                            txSigningPrecomposed,
                            account: selectedAccount,
                        }),
                    );

                return modifiedPayload as unknown as typeof payload;
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

export const ethereumSignTransaction: ConnectPopupMethodDefinition<'ethereumSignTransaction'> = {
    preCall,
};
