import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    buildStablecoinYieldTransactionReview,
    isUserCancelledSignErrorCode,
} from '@suite-common/earn-stablecoin';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type SynchronizeSentTransactionThunkDeps,
    type SynchronizeSentTransactionThunkState,
    type WalletSettingsRootState,
    type YieldFlowDisplayToken,
    type YieldFlowType,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    synchronizeSentTransactionThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type EvmSelectedFee,
} from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

// Marks failures of the final broadcast — the transaction is already signed at that point,
// which deserves a more specific message than the generic one.
export const PUSH_TRANSACTION_FAILED_CAUSE = 'PushTransactionFailed';

export const getYieldErrorTranslationKey = (error: unknown) => {
    if (!(error instanceof Error)) {
        return 'TR_EARN_YIELD_ERROR_GENERIC';
    }

    if (
        error.cause === 'Device_InvalidState' || // incorrect passphrase submitted
        error.cause === 'Method_Interrupted' // passphrase modal closed
    ) {
        return 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT';
    }

    if (error.cause === PUSH_TRANSACTION_FAILED_CAUSE) {
        return 'TR_EARN_YIELD_ERROR_PUSH_FAILED';
    }

    return 'TR_EARN_YIELD_ERROR_GENERIC';
};

export const getYieldSubmitErrorAnalyticsMessage = (error: unknown) =>
    error instanceof Error && error.cause === PUSH_TRANSACTION_FAILED_CAUSE
        ? 'push-failed'
        : 'submit-failed';

export type SendYieldTransactionState = DeviceRootState &
    MessageSystemRootState &
    SynchronizeSentTransactionThunkState &
    WalletSettingsRootState;
export type SendYieldTransactionDeps = SynchronizeSentTransactionThunkDeps;
type SendYieldTransactionDispatch = ThunkDispatch<
    SendYieldTransactionState,
    SendYieldTransactionDeps,
    UnknownAction
>;

// Genuine failures are thrown — a returned `cancelled` is always the user backing out on purpose.
export type SendYieldTransactionResult =
    { status: 'sent'; txid: string; fee: string } | { status: 'cancelled' };

export type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    unsignedTransaction: string;
    flowKey: string;
    flowType: YieldFlowType;
    dispatch: SendYieldTransactionDispatch;
    getState: () => SendYieldTransactionState;
    selectedFee: EvmSelectedFee | null;
};

export const sendYieldTransaction = async ({
    account,
    amount,
    token,
    unsignedTransaction,
    flowKey,
    flowType,
    dispatch,
    getState,
    selectedFee,
}: SendYieldTransactionParams): Promise<SendYieldTransactionResult> => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const transactionReview = buildStablecoinYieldTransactionReview({
        unsignedTransaction,
        selectedFee,
        amount,
        token,
        symbol: account.symbol,
    });

    const { transactionForSigning, formState, precomposedTransaction } = transactionReview;

    dispatch(
        yieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            // transactionForSigning.nonce is hex; store a decimal string so the review modal shows
            // it like the Send flow.
            precomposedForm: {
                ...formState,
                ethereumNonce: parseInt(transactionForSigning.nonce, 16).toString(),
            },
            accountKey: account.key,
            flowKey,
            flowType,
        }),
    );

    try {
        dispatch(preserveModal());

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            const { code } = signingResponse.error;
            if (isUserCancelledSignErrorCode(code)) {
                return { status: 'cancelled' };
            }

            throw new Error(`${code}: ${signingResponse.error.message}`, { cause: code });
        }

        dispatch(
            yieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            return { status: 'cancelled' };
        }

        const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
        const isMevProtectionFeatureEnabled = selectIsMevProtectionFeatureEnabled(getState());

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: getMevProtectedTxData(
                account.symbol,
                signingResponse.payload.serializedTx,
                isMevProtectionEnabled && isMevProtectionFeatureEnabled,
            ),
            coin: asCoinSymbol(account.symbol),
            identity: getAccountIdentity(account),
        });

        dispatch(closeModal());

        if (!pushResponse.success) {
            throw new Error(`${pushResponse.error.code}: ${pushResponse.error.message}`, {
                cause: PUSH_TRANSACTION_FAILED_CAUSE,
            });
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction,
                precomposedForm: formState,
                txid: pushResponse.payload.txid,
                // transactionForSigning.nonce is hex; the fake pending tx expects a decimal string.
                ethereumNonce: parseInt(transactionForSigning.nonce, 16).toString(),
            }),
        );

        return {
            status: 'sent',
            txid: pushResponse.payload.txid,
            fee: precomposedTransaction.fee,
        };
    } catch (error) {
        // Do not log the raw error: a failed broadcast surfaces the node's rejection message,
        // which (via viem) can embed the full signed transaction hex and the from-address.
        // console.error is forwarded to Sentry via captureConsoleIntegration, so log a static string.
        console.error('sendYieldTransaction failed');
        throw error;
    } finally {
        dispatch(yieldActions.discardTransaction());
    }
};
