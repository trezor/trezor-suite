import { selectSelectedDevice } from '@suite-common/device';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin/src/signing';
import { createThunk } from '@suite-common/redux-utils';
import {
    type YieldFlowDisplayToken,
    selectAddressDisplayType,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { EARN_MODULE_PREFIX } from './constants';
import { getPushErrorType } from './yieldTransactionThunks';

const WRAP_NATIVE_TOKEN_THUNK_PREFIX = `${EARN_MODULE_PREFIX}/wrap-native-token`;

export type WrapNativeTokenSignError = {
    error: 'sign-transaction-failed';
    errorCode?: string;
    message?: string;
};

export type WrapNativeTokenPushError = {
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    message?: string;
};

/** Everything the push phase needs, returned by the sign thunk and held by the review screen. */
export type SignedWrapNativeTokenTransaction = {
    serializedTx: string;
    precomposedTransaction: PrecomposedTransactionFinal;
    formState: FormState;
};

type SignWrapNativeTokenPayload = {
    account: Account;
    /** Native coin of the account (`contractAddress: null`) — the token being spent. */
    token: YieldFlowDisplayToken;
    amount: string;
    unsignedTransaction: string;
};

type PushWrapNativeTokenPayload = {
    account: Account;
    signedTransaction: SignedWrapNativeTokenTransaction;
};

/**
 * Signs a composed wrap transaction on the device. Unlike the yield action review thunks, it is
 * session-less — the standalone wrap has no vault, so all inputs are carried in the payload and
 * the signed transaction is returned to the caller instead of being stored in the yield session.
 */
export const signWrapNativeTokenThunk = createThunk<
    SignedWrapNativeTokenTransaction,
    SignWrapNativeTokenPayload,
    { rejectValue: WrapNativeTokenSignError }
>(
    `${WRAP_NATIVE_TOKEN_THUNK_PREFIX}/sign`,
    async ({ account, token, amount, unsignedTransaction }, { getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device || account.networkType !== 'ethereum') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
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
                        : 'Unsupported wrap transaction payload.',
            });
        }

        const { formState, precomposedTransaction, transactionForSigning } = transactionReview;
        const addressDisplayType = selectAddressDisplayType(getState());

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

export const pushWrapNativeTokenThunk = createThunk<
    { txid: string },
    PushWrapNativeTokenPayload,
    { rejectValue: WrapNativeTokenPushError }
>(
    `${WRAP_NATIVE_TOKEN_THUNK_PREFIX}/push`,
    async ({ account, signedTransaction }, { dispatch, rejectWithValue }) => {
        const pushResponse = await TrezorConnect.pushTransaction({
            tx: signedTransaction.serializedTx,
            coin: account.symbol,
            identity: getAccountIdentity(account),
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
