import { events } from '@suite-common/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import {
    type SynchronizeSentTransactionThunkDeps,
    type SynchronizeSentTransactionThunkState,
    type WalletSettingsRootState,
    type WrappedNativeFlowType,
    type YieldFlowDisplayToken,
    isEarnSigningCancelled,
    isWrappedNativeFlowSupported,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    synchronizeSentTransactionThunk,
    trackWrappedNativeTokenThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { EARN_MODULE_PREFIX } from '../../constants';
import {
    pushYieldTransaction,
    signYieldTransactionOnDevice,
} from '../../utils/earn/deviceTransactionUtils';
import { reportTransactionCreated } from '../../utils/earn/earnAnalyticsUtils';
import { getPushErrorType } from '../yield/yieldTransactionThunks';

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
    flowType: WrappedNativeFlowType;
    signedTransaction: SignedWrappedNativeTokenTransaction;
};

export type SignWrappedNativeTokenThunkState = DeviceRootState & WalletSettingsRootState;

/**
 * Signs a composed wrap/unwrap transaction on the device. Unlike the yield action review thunks,
 * it is session-less — the standalone wrapped-native flows have no vault, so all inputs are
 * carried in the payload and the signed transaction is returned to the caller instead of being
 * stored in the yield session.
 */
type SignWrappedNativeTokenThunkDeps = WithServices<NativeAnalyticsDep>;

export const signWrappedNativeTokenThunk = createThunk<
    SignedWrappedNativeTokenTransaction,
    SignWrappedNativeTokenPayload,
    {
        rejectValue: WrappedNativeTokenSignError;
        state: SignWrappedNativeTokenThunkState;
        extra: SignWrappedNativeTokenThunkDeps;
    }
>(
    `${WRAPPED_NATIVE_TOKEN_THUNK_PREFIX}/sign`,
    async (
        { account, token, amount, unsignedTransaction },
        { getState, rejectWithValue, extra },
    ) => {
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
            if (isEarnSigningCancelled(signingResponse.error)) {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: { txType: 'yield', networkSymbol: account.symbol, stage: 'signing' },
                });
            }

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

export type PushWrappedNativeTokenThunkState = MevProtectionRootState &
    SynchronizeSentTransactionThunkState &
    WalletSettingsRootState;

export type PushWrappedNativeTokenThunkDeps = SynchronizeSentTransactionThunkDeps &
    WithServices<NativeAnalyticsDep>;

export const pushWrappedNativeTokenThunk = createThunk<
    { txid: string },
    PushWrappedNativeTokenPayload,
    {
        rejectValue: WrappedNativeTokenPushError;
        state: PushWrappedNativeTokenThunkState;
        extra: PushWrappedNativeTokenThunkDeps;
    }
>(
    `${WRAPPED_NATIVE_TOKEN_THUNK_PREFIX}/push`,
    async (
        { account, flowType, signedTransaction },
        { dispatch, getState, rejectWithValue, extra },
    ) => {
        reportTransactionCreated({
            analytics: extra.services.analytics,
            symbol: account.symbol,
            precomposedTransaction: signedTransaction.precomposedTransaction,
            formState: signedTransaction.formState,
            txType: 'yield',
        });

        const pushResponse = await pushYieldTransaction({
            tx: signedTransaction.serializedTx,
            account,
            isMevProtectionEnabled:
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState()),
        });

        dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                flow: flowType,
                ...(pushResponse.success
                    ? ({ status: 'success', txid: pushResponse.payload.txid } as const)
                    : ({ status: 'error' } as const)),
            }),
        );

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

        if (flowType === 'wrap') {
            await dispatch(
                trackWrappedNativeTokenThunk({ accountKey: account.key, mode: 'ensure-tracked' }),
            );
        }

        return { txid: pushResponse.payload.txid };
    },
);
