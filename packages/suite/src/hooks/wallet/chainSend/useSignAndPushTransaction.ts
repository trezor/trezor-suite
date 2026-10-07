import { useCallback } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { useChainPushTransaction, useChainSignTransaction } from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { injectDispatch, injectGetState } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    enhancePrecomposedTransaction,
    selectIsMevProtectionEnabled,
    selectWalletChainSignOptions,
    showSentTransactionToastThunk,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { isRbfBumpFeeTransaction, isRbfTransaction } from '@suite-common/wallet-utils';
import { type PROTO } from '@trezor/connect';
import {
    type ChainNetwork,
    ChainSendError,
    type ChainSignedTransaction,
} from '@trezor/network-module-suite-common-types';
import { type Err, type Ok } from '@trezor/type-utils';

import { asStateBeforePush } from 'src/actions/labels/moveLabelsForRbfThunk';
import { RBF_ERROR_ALREADY_MINED } from 'src/actions/wallet/send/replaceByFeeErrorThunk';
import {
    applySendFormMetadataLabelsThunk,
    signAndPushSendFormTransactionThunk,
    updateRbfLabelsThunk,
} from 'src/actions/wallet/send/sendFormThunks';
import { useSendSessionContext } from 'src/support/chainSend/SendSessionContext';
import { type AppState } from 'src/types/suite';

import { useGetSendChainNetwork } from './useGetSendChainNetwork';

export type SignAndPushTransactionParams = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    selectedAccount?: Account;
    paymentRequests?: PROTO.PaymentRequest[];
};

/**
 * Broadcast, failed (`sign-transaction-timeout` keeps the review open to sign again), or nothing
 * when the user cancelled or declined.
 */
export type SignAndPushTransactionResult =
    Ok<{ txid: string }> | Err<{ code?: string; message: string }> | undefined;

// Reasons Connect reports for a signing the review interrupted (see TransactionReviewModalBody).
const SIGN_TIMEOUT_REASON = 'tx-timeout';
const SIGN_CANCEL_REASON = 'tx-cancelled';

const getErrorMessage = (error: unknown) =>
    error instanceof ChainSendError ? error.message : 'unknown-error';

/**
 * Signs a composed transaction on the device, asks the user to confirm it, and broadcasts it.
 *
 * With the `queryChainData` flag on, the account's chain network signs and broadcasts through
 * mutations and the transaction under review lives in the send session, not in the store. The
 * wallet's own sync is still told about the sent transaction for the views that read the store.
 * Otherwise the wallet's thunk does all of it.
 */
export const useSignAndPushTransaction = () => {
    const { dispatch, getState, analytics } = useServices(
        injectDispatch,
        injectGetState,
        injectDesktopAnalytics,
    );
    const { setSession } = useSendSessionContext();
    const getSendChainNetwork = useGetSendChainNetwork();
    const { mutateAsync: signTransaction } = useChainSignTransaction();
    const { mutateAsync: pushTransaction } = useChainPushTransaction();

    const signAndPushThroughNetwork = useCallback(
        async (
            network: ChainNetwork,
            selectedAccount: Account,
            { formState, precomposedTransaction, paymentRequests }: SignAndPushTransactionParams,
        ): Promise<SignAndPushTransactionResult> => {
            const device = selectSelectedDevice(getState());
            if (!device) return;

            const { enhancedPrecomposedTransaction, isTokenKnown } =
                await enhancePrecomposedTransaction({
                    transactionFormValues: formState,
                    precomposedTransaction,
                    selectedAccount,
                });
            const reviewedTransaction: GeneralPrecomposedTransactionFinal = {
                ...enhancedPrecomposedTransaction,
                createdTimestamp: new Date().getTime(),
                isTokenKnown,
            };
            setSession({
                accountKey: selectedAccount.key,
                precomposedForm: formState,
                precomposedTx: reviewedTransaction,
            });

            // The review modal shows signing and then broadcasting; Connect closing its UI after
            // signing must not close it.
            dispatch(preserveModal());

            analytics.report({
                type: events.sendInitialisedEvent.name,
                payload: { assetSymbol: selectedAccount.symbol },
            });

            let preparedNonce: string | undefined;
            let signed: ChainSignedTransaction;
            try {
                signed = await signTransaction({
                    network,
                    account: selectedAccount,
                    draft: formState,
                    precomposed: enhancedPrecomposedTransaction,
                    options: {
                        ...selectWalletChainSignOptions(getState() as AppState, {
                            account: selectedAccount,
                            device,
                            paymentRequests,
                        }),
                        // Shown in the review while the device asks the user.
                        onPrepared: ({ nonce }) => {
                            if (!nonce) return;
                            preparedNonce = nonce;
                            setSession(
                                current => current && { ...current, resolvedEthereumNonce: nonce },
                            );
                        },
                    },
                });
            } catch (error) {
                analytics.report({
                    type: events.sendConfirmedOnDeviceEvent.name,
                    payload: { assetSymbol: selectedAccount.symbol },
                });

                const message = getErrorMessage(error);

                // The review stays open to offer signing again.
                if (message === SIGN_TIMEOUT_REASON) {
                    return {
                        success: false,
                        error: {
                            code: 'sign-transaction-timeout',
                            message: 'Signing process timed out.',
                        },
                    };
                }

                if (message !== SIGN_CANCEL_REASON) {
                    dispatch(
                        notificationsActions.addToast({ type: 'sign-tx-error', error: message }),
                    );
                }

                // The review stays open to say the replaced transaction was mined meanwhile.
                if (message === RBF_ERROR_ALREADY_MINED) return;

                setSession(undefined);
                dispatch(closeModal());

                return;
            }

            analytics.report({
                type: events.sendConfirmedOnDeviceEvent.name,
                payload: { assetSymbol: selectedAccount.symbol },
            });

            setSession(
                current =>
                    current && {
                        ...current,
                        serializedTx: { tx: signed.serializedTx, symbol: selectedAccount.symbol },
                        signedTx: signed.signedTransaction,
                    },
            );

            const isPushConfirmed = await dispatch(
                openDeferredModal({ type: 'review-transaction' }),
            );
            if (!isPushConfirmed) return;

            const isMevProtectionEnabled =
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState());
            // Moving labels of a replaced transaction compares against the state before the push.
            const stateBeforePush = asStateBeforePush(getState());

            let txid: string;
            try {
                ({ txid } = await pushTransaction({
                    network,
                    account: selectedAccount,
                    serializedTx: signed.serializedTx,
                    isMevProtectionEnabled,
                    origin: {
                        precomposed: reviewedTransaction,
                        signed,
                        replacedTxid: isRbfTransaction(reviewedTransaction)
                            ? reviewedTransaction.prevTxid
                            : undefined,
                    },
                }));
            } catch (error) {
                dispatch(closeModal());

                const message = getErrorMessage(error);
                dispatch(notificationsActions.addToast({ type: 'sign-tx-error', error: message }));
                setSession(
                    current =>
                        current && { ...current, serializedTx: undefined, signedTx: undefined },
                );

                return {
                    success: false,
                    error: {
                        code: error instanceof ChainSendError ? error.connectErrorCode : undefined,
                        message,
                    },
                };
            }

            dispatch(closeModal());
            dispatch(
                showSentTransactionToastThunk({
                    selectedAccount,
                    precomposedTransaction: reviewedTransaction,
                    precomposedForm: formState,
                    txid,
                }),
            );
            dispatch(
                synchronizeSentTransactionThunk({
                    selectedAccount,
                    precomposedTransaction: reviewedTransaction,
                    precomposedForm: formState,
                    txid,
                    ethereumNonce: signed.nonce ?? preparedNonce,
                    signedTransaction: signed.signedTransaction,
                }),
            );

            if (isRbfBumpFeeTransaction(enhancedPrecomposedTransaction)) {
                const deviceStaticSessionId = device.state?.staticSessionId;
                if (deviceStaticSessionId) {
                    dispatch(
                        updateRbfLabelsThunk({
                            deviceStaticSessionId,
                            precomposedTransaction: enhancedPrecomposedTransaction,
                            txid,
                            stateBeforePush,
                            prevTxid: enhancedPrecomposedTransaction.prevTxid,
                            signedTransaction: signed.signedTransaction,
                        }),
                    );
                }
            }

            dispatch(
                applySendFormMetadataLabelsThunk({
                    selectedAccount,
                    formState,
                    precomposedTransaction,
                    txid,
                }),
            );

            setSession(undefined);

            return { success: true, payload: { txid } };
        },
        [analytics, dispatch, getState, pushTransaction, setSession, signTransaction],
    );

    return useCallback(
        (params: SignAndPushTransactionParams): Promise<SignAndPushTransactionResult> => {
            const { selectedAccount } = params;
            const network = getSendChainNetwork(selectedAccount);

            if (network && selectedAccount) {
                return signAndPushThroughNetwork(network, selectedAccount, params);
            }

            return dispatch(signAndPushSendFormTransactionThunk(params)).unwrap();
        },
        [dispatch, getSendChainNetwork, signAndPushThroughNetwork],
    );
};
