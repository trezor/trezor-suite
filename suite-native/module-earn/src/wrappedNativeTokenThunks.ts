import { selectSelectedDevice } from '@suite-common/device';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin/src/signing';
import { createThunk } from '@suite-common/redux-utils';
import {
    type YieldFlowDisplayToken,
    isWrappedNativeFlowSupported,
    selectAddressDisplayType,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { EARN_MODULE_PREFIX } from './constants';
import { pushYieldTransaction, signYieldTransactionOnDevice } from './utils/deviceTransactionUtils';
import { getPushErrorType } from './yieldTransactionThunks';

const WRAPPED_NATIVE_TOKEN_THUNK_PREFIX = `${EARN_MODULE_PREFIX}/wrapped-native-token`;

export type WrappedNativeTokenSignError = {
    error: 'sign-transaction-failed';
    errorCode?: string;
    message?: string;
};

export type WrappedNativeTokenPushError = {
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    message?: string;
};

/** Everything the push phase needs, returned by the sign thunk and held by the review screen. */
export type SignedWrappedNativeTokenTransaction = {
    serializedTx: string;
    precomposedTransaction: PrecomposedTransactionFinal;
    formState: FormState;
};

type SignWrappedNativeTokenPayload = {
    account: Account;
    /** Token being spent — the native coin for a wrap, the wrapped token for an unwrap. */
    token: YieldFlowDisplayToken;
    amount: string;
    unsignedTransaction: string;
};

type PushWrappedNativeTokenPayload = {
    account: Account;
    signedTransaction: SignedWrappedNativeTokenTransaction;
};

/**
 * Signs a composed wrap/unwrap transaction on the device. Unlike the yield action review thunks,
 * it is session-less — the standalone wrapped-native flows have no vault, so all inputs are
 * carried in the payload and the signed transaction is returned to the caller instead of being
 * stored in the yield session.
 */
export const signWrappedNativeTokenThunk = createThunk<
    SignedWrappedNativeTokenTransaction,
    SignWrappedNativeTokenPayload,
    { rejectValue: WrappedNativeTokenSignError }
>(
    `${WRAPPED_NATIVE_TOKEN_THUNK_PREFIX}/sign`,
    async ({ account, token, amount, unsignedTransaction }, { getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device || account.networkType !== 'ethereum') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
            });
        }

        if (!isWrappedNativeFlowSupported(device)) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Firmware does not support wrap/unwrap.',
            });
        }

        let transactionReview: ReturnType<typeof buildStablecoinYieldTransactionReview>;

        try {
            transactionReview = buildStablecoinYieldTransactionReview({
                amount,
                selectedFee: null,
                symbol: account.symbol,
                token,
                unsignedTransaction,
            });
        } catch (error) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unsupported wrapped-native transaction payload.',
            });
        }

        const { formState, precomposedTransaction, transactionForSigning } = transactionReview;
        const addressDisplayType = selectAddressDisplayType(getState());

        const signingResponse = await signYieldTransactionOnDevice({
            device,
            path: account.path,
            transaction: transactionForSigning,
            addressDisplayType,
        });

        if (!signingResponse.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: signingResponse.error.code,
                message: signingResponse.error.message,
            });
        }

        return {
            serializedTx: signingResponse.payload.serializedTx,
            precomposedTransaction,
            formState,
        };
    },
);

export const pushWrappedNativeTokenThunk = createThunk<
    { txid: string },
    PushWrappedNativeTokenPayload,
    { rejectValue: WrappedNativeTokenPushError }
>(
    `${WRAPPED_NATIVE_TOKEN_THUNK_PREFIX}/push`,
    async ({ account, signedTransaction }, { dispatch, rejectWithValue }) => {
        const pushResponse = await pushYieldTransaction({
            tx: signedTransaction.serializedTx,
            account,
        });

        if (!pushResponse.success) {
            return rejectWithValue({
                error: getPushErrorType(pushResponse.error.message),
                message: pushResponse.error.message,
            });
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction: signedTransaction.precomposedTransaction,
                precomposedForm: signedTransaction.formState,
                txid: pushResponse.payload.txid,
            }),
        );

        return { txid: pushResponse.payload.txid };
    },
);
