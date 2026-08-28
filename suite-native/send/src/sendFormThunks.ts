import { isRejected } from '@reduxjs/toolkit';

import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type EnhancePrecomposedTransactionThunkState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type PushTransactionError,
    type SendRootState,
    type SignTransactionError,
    type SignTransactionThunkState,
    type SignTransactionTimeoutError,
    enhancePrecomposedTransactionThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
    selectSendFormDraftByKey,
    selectSendFormDrafts,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import {
    type AddTransactionLabelingThunkDeps,
    type AddTransactionLabelingThunkState,
    type UpdateSelectedFeeLevelThunkParams,
    addTransactionLabelingThunk,
} from '@suite-native/transaction-management';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import { type Ok } from '@trezor/type-utils';
import { isNotNull, isNotNullOrUndefined, typedObjectKeys } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './constants';

export type SignTransactionNativeThunkState = SendRootState &
    EnhancePrecomposedTransactionThunkState &
    SignTransactionThunkState;

export const signTransactionNativeThunk = createThunk<
    BlockbookTransaction | undefined,
    {
        accountKey: AccountKey;
        feeLevel: GeneralPrecomposedTransactionFinal;
        tokenContract?: TokenAddress;
        // Overrides the account's send draft, for flows that sign a form state which was never
        // stored as a draft (e.g. a composed cancel transaction).
        formState?: FormState;
    },
    {
        rejectValue: SignTransactionError | SignTransactionTimeoutError | undefined;
        state: SignTransactionNativeThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signTransactionNativeThunk`,
    async (
        { accountKey, tokenContract, feeLevel, formState: providedFormState },
        { dispatch, rejectWithValue, fulfillWithValue, getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const formState =
            providedFormState ?? selectSendFormDraftByKey(getState(), accountKey, tokenContract);

        if (!account || !formState)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account or form draft not found.',
            });

        // prepare transaction with select fee level
        const precomposedTransaction = await dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction: feeLevel,
                selectedAccount: account,
            }),
        ).unwrap();

        if (!precomposedTransaction)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Unable to precompose transaction for signing.',
            });
        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount: account,
                }),
            ),
        );

        if (!deviceAccessResponse.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            return rejectWithValue(signTransactionResponse.payload);
        }

        return fulfillWithValue(signTransactionResponse.payload.signedTx);
    },
);

type CleanupSendFormThunkParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    shouldDeleteDraft?: boolean;
};
export type CleanupSendFormThunkState = DeviceRootState;

export const cleanupSendFormThunk = createThunk<
    void,
    CleanupSendFormThunkParams,
    { state: CleanupSendFormThunkState }
>(
    `${SEND_MODULE_PREFIX}/cleanupSendFormThunk`,
    ({ accountKey, tokenContract, shouldDeleteDraft = true }, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        dispatch(sendFormActions.dispose());

        if (shouldDeleteDraft) dispatch(sendFormActions.removeDraft({ accountKey, tokenContract }));

        // todo: maybe not needed anymore
        dispatch(deviceActions.removeButtonRequests({ device }));
    },
);

export type RemoveSendFormDraftsSupportingAmountUnitThunkState = AccountsRootState & SendRootState;

export const removeSendFormDraftsSupportingAmountUnitThunk = createThunk<
    void,
    void,
    { state: RemoveSendFormDraftsSupportingAmountUnitThunkState }
>(
    `${SEND_MODULE_PREFIX}/removeSendFormDraftsSupportingAmountUnitThunk`,
    (_, { dispatch, getState }) => {
        const sendFormDrafts = selectSendFormDrafts(getState());
        // Draft keys may include tokenContract, but no token networks use amount-unit, so it's fine (for now).
        const accountKeys = typedObjectKeys(sendFormDrafts);

        accountKeys.forEach(accountKey => {
            const account = selectAccountByKey(getState(), accountKey as AccountKey); // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
            if (account && hasNetworkFeatures(account, 'amount-unit')) {
                dispatch(sendFormActions.removeDraft({ accountKey: accountKey as AccountKey })); // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
            }
        });
    },
);

export type UpdateSelectedFeeLevelThunkState = SendRootState;

export const updateSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateSelectedFeeLevelThunkState }
>(
    `${SEND_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        { accountKey, tokenContract, feeLevelLabel, feePerUnit, feeLimit },
        { dispatch, getState },
    ) => {
        const draft = selectSendFormDraftByKey(getState(), accountKey, tokenContract);

        if (!draft) throw Error('Draft not found.');
        const draftCopy = { ...draft };

        draftCopy.selectedFee = feeLevelLabel;
        if (feePerUnit) {
            draftCopy.feePerUnit = feePerUnit;
        }
        if (feeLimit) {
            draftCopy.feeLimit = feeLimit;
        }

        dispatch(sendFormActions.storeDraft({ accountKey, tokenContract, formState: draftCopy }));
    },
);

type SendTransactionThunkParams = {
    selectedAccount: Account;
    wasAppLeftDuringReview: boolean;
    tokenContract?: TokenAddress;
};

export type SendTransactionThunkState = MevProtectionRootState &
    TokensRootState &
    PushSendFormTransactionThunkState &
    AddTransactionLabelingThunkState;
export type SendTransactionThunkDeps = PushSendFormTransactionThunkDeps &
    AddTransactionLabelingThunkDeps &
    WithServices<NativeAnalyticsDep>;

export const sendTransactionThunk = createThunk<
    Ok<{ txid: string }>,
    SendTransactionThunkParams,
    {
        rejectValue: PushTransactionError;
        state: SendTransactionThunkState;
        extra: SendTransactionThunkDeps;
    }
>(
    `${SEND_MODULE_PREFIX}/sendTransactionThunk`,
    async (
        { selectedAccount, wasAppLeftDuringReview, tokenContract },
        { dispatch, getState, rejectWithValue, fulfillWithValue, extra },
    ) => {
        const isMevProtectionEnabled =
            selectIsMevProtectionEnabled(getState()) &&
            selectIsMevProtectionFeatureEnabled(getState());
        const sendResponse = await dispatch(
            pushSendFormTransactionThunk({ selectedAccount, isMevProtectionEnabled }),
        );

        if (sendResponse.payload === undefined) {
            return rejectWithValue({
                error: 'push-transaction-failed',
                metadata: {
                    success: false,
                    error: { message: 'Payload is undefined.', code: 'Failure_UnknownCode' },
                },
            });
        }

        if (!('success' in sendResponse.payload)) {
            return rejectWithValue(sendResponse.payload);
        }

        const formValues = selectSendFormDraftByKey(getState(), selectedAccount.key, tokenContract);

        if (isNotNull(formValues)) {
            await dispatch(
                addTransactionLabelingThunk({
                    txId: sendResponse.payload.payload.txid,
                    selectedAccount,
                }),
            );

            const tokenSymbol = selectAccountTokenSymbol(
                getState(),
                selectedAccount.key,
                tokenContract,
            );

            extra.services.analytics.report({
                type: events.sendTransactionDispatchedEvent.name,
                payload: {
                    symbol: selectedAccount.symbol,
                    tokenAddresses: tokenContract ? [tokenContract] : undefined,
                    tokenSymbols: tokenSymbol ? [tokenSymbol] : undefined,
                    outputsCount: formValues.outputs.length,
                    selectedFee: formValues.selectedFee ?? 'normal',
                    hasDestinationTag: isNotNullOrUndefined(formValues.destinationTag),
                    wasAppLeftDuringReview,
                },
            });
        }

        return fulfillWithValue(sendResponse.payload);
    },
);
