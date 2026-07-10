import { selectSelectedDevice } from '@suite-common/device';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin/src/signing';
import { createThunk } from '@suite-common/redux-utils';
import {
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldPositionFlowType,
    isYieldTxReviewForFlow,
    selectAddressDisplayType,
    selectStablecoinYieldSession,
    selectStablecoinYieldTxReview,
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import { AddressDisplayOptions, type EvmSelectedFee } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { EARN_MODULE_PREFIX } from './constants';

const YIELD_TRANSACTION_THUNK_PREFIX = `${EARN_MODULE_PREFIX}/yield-transaction`;

type YieldActionReviewThunkPayload = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    flowType: YieldPositionFlowType;
    reviewToken?: YieldFlowDisplayToken;
    selectedFee?: EvmSelectedFee | null;
};

type YieldSignTransactionError = {
    error: 'sign-transaction-failed';
    errorCode?: string;
    message?: string;
};

export type YieldPushTransactionError = {
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    message?: string;
};

export const getPushErrorType = (message: string): YieldPushTransactionError['error'] =>
    message.includes('could not replace existing tx')
        ? 'push-transaction-pending-conflict'
        : 'push-transaction-failed';

export const signYieldActionReviewThunk = createThunk<
    { serializedTx: string },
    YieldActionReviewThunkPayload,
    { rejectValue: YieldSignTransactionError }
>(
    `${YIELD_TRANSACTION_THUNK_PREFIX}/signActionReview`,
    async (
        { flowData, flowKey, flowType, reviewToken, selectedFee },
        { dispatch, getState, rejectWithValue },
    ) => {
        const session = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const {
            action: { review },
        } = session;
        const device = selectSelectedDevice(getState());

        if (review?.type !== flowType || !device || flowData.account.networkType !== 'ethereum') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
            });
        }

        if (flowType === 'withdraw' && !selectedFee) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Fee information is missing for the transaction.',
            });
        }

        let transactionReview: ReturnType<typeof buildStablecoinYieldTransactionReview>;

        try {
            transactionReview = buildStablecoinYieldTransactionReview({
                amount: review.amount,
                selectedFee: selectedFee ?? null,
                symbol: flowData.account.symbol,
                token: reviewToken ?? flowData.token,
                unsignedTransaction: review.unsignedTransaction,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unsupported yield transaction payload.';

            return rejectWithValue({
                error: 'sign-transaction-failed',
                message,
            });
        }

        const { formState, precomposedTransaction, transactionForSigning } = transactionReview;
        const addressDisplayType = selectAddressDisplayType(getState());

        dispatch(
            stablecoinYieldActions.storePrecomposedTransaction({
                precomposedTx: precomposedTransaction,
                precomposedForm: formState,
                accountKey: flowData.account.key,
                flowKey,
                flowType,
            }),
        );

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: flowData.account.path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: signingResponse.error.code,
                message: signingResponse.error.message,
            });
        }

        const currentTxReview = selectStablecoinYieldTxReview(getState());

        if (
            !isYieldTxReviewForFlow(currentTxReview, {
                accountKey: flowData.account.key,
                flowKey,
                flowType,
            }) ||
            currentTxReview.precomposedForm !== formState ||
            currentTxReview.precomposedTx !== precomposedTransaction
        ) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'tx-cancelled',
            });
        }

        dispatch(
            stablecoinYieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: flowData.account.symbol,
                },
            }),
        );

        return { serializedTx: signingResponse.payload.serializedTx };
    },
);

export const pushYieldActionReviewThunk = createThunk<
    { txid: string },
    YieldActionReviewThunkPayload,
    { rejectValue: YieldPushTransactionError }
>(
    `${YIELD_TRANSACTION_THUNK_PREFIX}/pushActionReview`,
    async ({ flowData, flowKey, flowType }, { dispatch, getState, rejectWithValue }) => {
        const session = selectStablecoinYieldSession(getState(), flowType, flowKey);
        const txReview = selectStablecoinYieldTxReview(getState());
        const { precomposedForm, precomposedTx, serializedTx } = txReview;
        const {
            action: { review },
        } = session;

        if (
            review?.type !== flowType ||
            !isYieldTxReviewForFlow(txReview, {
                accountKey: flowData.account.key,
                flowKey,
                flowType,
            }) ||
            !serializedTx ||
            !precomposedForm ||
            !precomposedTx
        ) {
            return rejectWithValue({
                error: 'push-transaction-failed',
                message: 'Transaction not found.',
            });
        }

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: serializedTx.tx,
            coin: serializedTx.symbol,
            identity: getAccountIdentity(flowData.account),
        });

        dispatch(stablecoinYieldActions.discardTransaction());

        if (!pushResponse.success) {
            return rejectWithValue({
                error: getPushErrorType(pushResponse.error.message),
                message: pushResponse.error.message,
            });
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: flowData.account,
                precomposedTransaction: precomposedTx,
                precomposedForm,
                txid: pushResponse.payload.txid,
            }),
        );

        dispatch(
            stablecoinYieldActions.setPendingTx({
                flowType,
                flowKey,
                tx: {
                    type: flowType,
                    txid: pushResponse.payload.txid,
                    amount: review.amount,
                    fee: precomposedTx.fee,
                    submittedAt: Date.now(),
                },
                receiptAmount: review.receiptAmount,
            }),
        );

        return { txid: pushResponse.payload.txid };
    },
);
