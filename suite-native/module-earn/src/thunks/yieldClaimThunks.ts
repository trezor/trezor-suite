import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { buildClaimTransactionReview } from '@suite-common/earn-stablecoin';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import {
    type FormDraftRootState,
    type SynchronizeSentTransactionThunkDeps,
    type SynchronizeSentTransactionThunkState,
    type WalletSettingsRootState,
    type YieldRootState,
    formDraftActions,
    isYieldTxReviewForFlow,
    selectAddressDisplayType,
    selectDeepCopyOfFormDraft,
    selectIsMevProtectionEnabled,
    selectYieldSession,
    selectYieldTxReview,
    synchronizeSentTransactionThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { type UpdateSelectedFeeLevelThunkParams } from '@suite-native/transaction-management';

import { EARN_MODULE_PREFIX } from '../constants';
import { getPushErrorType } from './yieldTransactionThunks';
import type { YieldPushTransactionError } from './yieldTransactionThunks';
import {
    pushYieldTransaction,
    signYieldTransactionOnDevice,
} from '../utils/earn/deviceTransactionUtils';
import { getSelectedFeeFromUnsignedClaimTransaction } from '../utils/yield/yieldClaimFeeUtils';
import { buildYieldClaimRewards } from '../utils/yield/yieldClaimReviewUtils';

export const getYieldClaimFormDraftKey = (flowKey: string) => `yield-claim/${flowKey}`;

type SignYieldClaimReviewThunkPayload = {
    account: Account;
    flowKey: string;
};

type YieldClaimSignTransactionError = {
    error: 'sign-transaction-failed';
    errorCode?: string;
    message?: string;
};

export type UpdateYieldClaimSelectedFeeLevelThunkState = FormDraftRootState;

export const updateYieldClaimSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateYieldClaimSelectedFeeLevelThunkState }
>(
    `${EARN_MODULE_PREFIX}/updateYieldClaimSelectedFeeLevelThunk`,
    (
        { feeLevelLabel, feePerUnit, feeLimit, formDraftKey, maxFeePerGas, maxPriorityFeePerGas },
        { dispatch, getState },
    ) => {
        if (!formDraftKey) return;

        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
            FormState | undefined;

        if (!formDraft) return;

        formDraft.selectedFee = feeLevelLabel;

        if (feePerUnit) {
            formDraft.feePerUnit = feePerUnit;
        }

        if (feeLimit) {
            formDraft.feeLimit = feeLimit;
        }

        if (maxFeePerGas) {
            formDraft.maxFeePerGas = maxFeePerGas;
        }

        if (maxPriorityFeePerGas) {
            formDraft.maxPriorityFeePerGas = maxPriorityFeePerGas;
        }

        dispatch(formDraftActions.storeDraft({ key: formDraftKey, formDraft }));
    },
);

export type SignYieldClaimReviewThunkState = DeviceRootState &
    YieldRootState &
    WalletSettingsRootState;

export const signYieldClaimReviewThunk = createThunk<
    { serializedTx: string },
    SignYieldClaimReviewThunkPayload,
    { rejectValue: YieldClaimSignTransactionError; state: SignYieldClaimReviewThunkState }
>(
    `${EARN_MODULE_PREFIX}/signYieldClaimReviewThunk`,
    async ({ account, flowKey }, { dispatch, getState, rejectWithValue }) => {
        const session = selectYieldSession(getState(), 'claim', flowKey);
        const {
            action: { review },
        } = session;
        const device = selectSelectedDevice(getState());

        if (review?.type !== 'claim' || !device || account.networkType !== 'ethereum') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid input data.',
            });
        }

        let transactionReview: ReturnType<typeof buildClaimTransactionReview>;

        try {
            transactionReview = buildClaimTransactionReview({
                rewards: buildYieldClaimRewards(review),
                selectedFee: getSelectedFeeFromUnsignedClaimTransaction(review.unsignedTransaction),
                unsignedTransaction: review.unsignedTransaction,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unsupported yield claim payload.';

            return rejectWithValue({
                error: 'sign-transaction-failed',
                message,
            });
        }

        const { availableRewards, formState, precomposedTransaction, transactionForSigning } =
            transactionReview;
        const addressDisplayType = selectAddressDisplayType(getState());

        dispatch(
            yieldActions.storePrecomposedTransaction({
                precomposedTx: precomposedTransaction,
                precomposedForm: formState,
                availableRewards,
                accountKey: account.key,
                flowKey,
                flowType: 'claim',
            }),
        );

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

        const currentTxReview = selectYieldTxReview(getState());

        if (
            !isYieldTxReviewForFlow(currentTxReview, {
                accountKey: account.key,
                flowKey,
                flowType: 'claim',
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
            yieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        return { serializedTx: signingResponse.payload.serializedTx };
    },
);

export type PushYieldClaimReviewThunkState = MevProtectionRootState &
    YieldRootState &
    SynchronizeSentTransactionThunkState &
    WalletSettingsRootState;

export type PushYieldClaimReviewThunkDeps = SynchronizeSentTransactionThunkDeps;

export const pushYieldClaimReviewThunk = createThunk<
    { txid: string },
    SignYieldClaimReviewThunkPayload,
    {
        rejectValue: YieldPushTransactionError;
        state: PushYieldClaimReviewThunkState;
        extra: PushYieldClaimReviewThunkDeps;
    }
>(
    `${EARN_MODULE_PREFIX}/pushYieldClaimReviewThunk`,
    async ({ account, flowKey }, { dispatch, getState, rejectWithValue }) => {
        const session = selectYieldSession(getState(), 'claim', flowKey);
        const txReview = selectYieldTxReview(getState());
        const { precomposedForm, precomposedTx, serializedTx } = txReview;
        const {
            action: { review },
        } = session;

        if (
            review?.type !== 'claim' ||
            !isYieldTxReviewForFlow(txReview, {
                accountKey: account.key,
                flowKey,
                flowType: 'claim',
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

        const pushResponse = await pushYieldTransaction({
            tx: serializedTx.tx,
            account,
            isMevProtectionEnabled:
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState()),
        });

        dispatch(yieldActions.discardTransaction());

        if (!pushResponse.success) {
            return rejectWithValue({
                error: getPushErrorType(pushResponse.error.message),
                message: pushResponse.error.message,
            });
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction: precomposedTx,
                precomposedForm,
                txid: pushResponse.payload.txid,
            }),
        );

        dispatch(
            yieldActions.setPendingTx({
                flowType: 'claim',
                flowKey,
                tx: {
                    type: 'claim',
                    txid: pushResponse.payload.txid,
                    amount: '',
                    fee: precomposedTx.fee,
                    submittedAt: Date.now(),
                },
            }),
        );

        return { txid: pushResponse.payload.txid };
    },
);
