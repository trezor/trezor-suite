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
    type ChainSendAccount,
    ChainSendError,
    type ChainSignedTransaction,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { type Err, type Ok } from '@trezor/type-utils';

import { asStateBeforePush } from 'src/actions/labels/moveLabelsForRbfThunk';
import { RBF_ERROR_ALREADY_MINED } from 'src/actions/wallet/send/replaceByFeeErrorThunk';
import {
    applySendFormMetadataLabelsThunk,
    signAndPushSendFormTransactionThunk,
    updateRbfLabelsThunk,
} from 'src/actions/wallet/send/sendFormThunks';
import {
    type RuntimeSendTarget,
    type SendSession,
    useSendSessionContext,
} from 'src/support/chainSend/SendSessionContext';
import { type AppState } from 'src/types/suite';

import { useGetSendChainNetwork } from './useGetSendChainNetwork';

export type SignAndPushTransactionParams = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    selectedAccount?: Account;
    paymentRequests?: PROTO.PaymentRequest[];
};

/** Whose send it is: a wallet account's, or a runtime network's at a wallet account's address. */
export type ChainSendTarget =
    { kind: 'wallet'; account: Account } | { kind: 'runtime'; runtime: RuntimeSendTarget };

export type SignAndPushThroughNetworkParams = {
    network: ChainNetwork;
    target: ChainSendTarget;
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
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

// Runtime networks are reported under one name: which networks a user added stays on the device.
const RUNTIME_ANALYTICS_SYMBOL = asNetworkSymbol('runtime-evm');

const getErrorMessage = (error: unknown) =>
    error instanceof ChainSendError ? error.message : 'unknown-error';

const getTargetAccount = (target: ChainSendTarget): ChainSendAccount =>
    target.kind === 'wallet' ? target.account : target.runtime.account;

type ReviewedTransaction = Pick<SendSession, 'precomposedForm' | 'precomposedTx'>;

const createSession = (target: ChainSendTarget, reviewed: ReviewedTransaction): SendSession =>
    target.kind === 'wallet'
        ? { kind: 'wallet', accountKey: target.account.key, ...reviewed }
        : { kind: 'runtime', runtime: target.runtime, ...reviewed };

/**
 * Signs a composed transaction on the device through its chain network, asks the user to confirm
 * it, and broadcasts it. The transaction under review lives in the send session, not in the
 * store. A wallet account's send is then followed up by the wallet (toast, sync, labels); a
 * runtime network's send only gets its own toast.
 */
export const useSignAndPushThroughNetwork = () => {
    const { dispatch, getState, analytics } = useServices(
        injectDispatch,
        injectGetState,
        injectDesktopAnalytics,
    );
    const { setSession } = useSendSessionContext();
    const { mutateAsync: signTransaction } = useChainSignTransaction();
    const { mutateAsync: pushTransaction } = useChainPushTransaction();

    /**
     * The wallet's own follow-up of a broadcast: its toast, its sync, labels. A runtime network's
     * send has none of it: the wallet does not track its account.
     */
    const onWalletBroadcast = useCallback(
        ({
            selectedAccount,
            formState,
            precomposedTransaction,
            reviewedTransaction,
            enhancedPrecomposedTransaction,
            signed,
            preparedNonce,
            txid,
            stateBeforePush,
        }: {
            selectedAccount: Account;
            formState: FormState;
            precomposedTransaction: GeneralPrecomposedTransactionFinal;
            reviewedTransaction: GeneralPrecomposedTransactionFinal;
            enhancedPrecomposedTransaction: GeneralPrecomposedTransactionFinal;
            signed: ChainSignedTransaction;
            preparedNonce: string | undefined;
            txid: string;
            stateBeforePush: ReturnType<typeof asStateBeforePush>;
        }) => {
            const device = selectSelectedDevice(getState());
            dispatch(
                showSentTransactionToastThunk({
                    selectedAccount,
                    precomposedTransaction: reviewedTransaction,
                    precomposedForm: formState,
                    txid,
                }),
            );
            // Legacy bridge: views still reading the wallet store (coin control, nonces, staking)
            // learn of the send from its sync. Goes away with the sync migration (roadmap phase 2).
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
                const deviceStaticSessionId = device?.state?.staticSessionId;
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
        },
        [dispatch, getState],
    );

    const signAndPushThroughNetwork = useCallback(
        async ({
            network,
            target,
            formState,
            precomposedTransaction,
            paymentRequests,
        }: SignAndPushThroughNetworkParams): Promise<SignAndPushTransactionResult> => {
            const device = selectSelectedDevice(getState());
            const { send } = network;
            if (!device || !send) return;

            const account = getTargetAccount(target);
            const isRuntime = target.kind === 'runtime';
            const assetSymbol = isRuntime ? RUNTIME_ANALYTICS_SYMBOL : account.symbol;

            const { precomposed: enhancedPrecomposedTransaction, isTokenKnown } =
                await send.prepareForReview({
                    account,
                    draft: formState,
                    precomposed: precomposedTransaction,
                });
            const reviewedTransaction: GeneralPrecomposedTransactionFinal = {
                ...enhancedPrecomposedTransaction,
                createdTimestamp: new Date().getTime(),
                isTokenKnown,
            };
            setSession(
                createSession(target, {
                    precomposedForm: formState,
                    precomposedTx: reviewedTransaction,
                }),
            );

            // The review modal shows signing and then broadcasting; Connect closing its UI after
            // signing must not close it.
            dispatch(preserveModal());

            analytics.report({ type: events.sendInitialisedEvent.name, payload: { assetSymbol } });

            let preparedNonce: string | undefined;
            let signed: ChainSignedTransaction;
            try {
                signed = await signTransaction({
                    network,
                    account,
                    draft: formState,
                    precomposed: enhancedPrecomposedTransaction,
                    options: {
                        ...selectWalletChainSignOptions(getState() as AppState, {
                            device,
                            paymentRequests,
                        }),
                        // Shown in the review while the device asks the user.
                        onPrepared: ({ nonce }) => {
                            if (!nonce) return;
                            preparedNonce = nonce;
                            setSession(current => current && { ...current, preparedNonce: nonce });
                        },
                    },
                });
            } catch (error) {
                analytics.report({
                    type: events.sendConfirmedOnDeviceEvent.name,
                    payload: { assetSymbol },
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
                payload: { assetSymbol },
            });

            setSession(
                current =>
                    current && {
                        ...current,
                        serializedTx: { tx: signed.serializedTx, symbol: account.symbol },
                        signedTx: signed.signedTransaction,
                    },
            );

            const isPushConfirmed = await dispatch(
                openDeferredModal({ type: 'review-transaction' }),
            );
            if (!isPushConfirmed) return;

            // A runtime network's nodes offer no private relay.
            const isMevProtectionEnabled =
                !isRuntime &&
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState());
            // Moving labels of a replaced transaction compares against the state before the push.
            const stateBeforePush = asStateBeforePush(getState());

            let txid: string;
            try {
                ({ txid } = await pushTransaction({
                    network,
                    account,
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

            if (target.kind === 'wallet') {
                onWalletBroadcast({
                    selectedAccount: target.account,
                    formState,
                    precomposedTransaction,
                    reviewedTransaction,
                    enhancedPrecomposedTransaction,
                    signed,
                    preparedNonce,
                    txid,
                    stateBeforePush,
                });
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'runtime-chain-tx-sent',
                        amount: formState.outputs[0]?.amount ?? '',
                        displaySymbol: target.runtime.network.nativeSymbol,
                        txid,
                    }),
                );
            }

            setSession(undefined);

            return { success: true, payload: { txid } };
        },
        [
            analytics,
            dispatch,
            getState,
            onWalletBroadcast,
            pushTransaction,
            setSession,
            signTransaction,
        ],
    );

    return signAndPushThroughNetwork;
};

/**
 * Signs a composed transaction of a wallet account on the device, asks the user to confirm it,
 * and broadcasts it.
 *
 * With the `queryChainData` flag on, the account's chain network signs and broadcasts through
 * mutations (see `useSignAndPushThroughNetwork`); the wallet's own sync is still told about the
 * sent transaction for the views that read the store. Otherwise the wallet's thunk does all of it.
 */
export const useSignAndPushTransaction = () => {
    const { dispatch } = useServices(injectDispatch);
    const getSendChainNetwork = useGetSendChainNetwork();
    const signAndPushThroughNetwork = useSignAndPushThroughNetwork();

    return useCallback(
        (params: SignAndPushTransactionParams): Promise<SignAndPushTransactionResult> => {
            const { selectedAccount } = params;
            const network = getSendChainNetwork(selectedAccount);

            if (network && selectedAccount) {
                return signAndPushThroughNetwork({
                    ...params,
                    network,
                    target: { kind: 'wallet', account: selectedAccount },
                });
            }

            return dispatch(signAndPushSendFormTransactionThunk(params)).unwrap();
        },
        [dispatch, getSendChainNetwork, signAndPushThroughNetwork],
    );
};
