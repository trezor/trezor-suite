import { getTransactionCreatedEventPayload, events as sharedEvents } from '@suite-common/analytics';
import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { type TokenAddress } from '@suite-common/tokens';
import {
    type AccountsRootState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    type PushTransactionError,
    type SendRootState,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
    selectSendFormDraftByKey,
    selectSendFormDrafts,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import {
    type AddTransactionLabelingThunkDeps,
    type AddTransactionLabelingThunkState,
    type UpdateSelectedFeeLevelThunkParams,
    addTransactionLabelingThunk,
} from '@suite-native/transaction-management';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { type Ok } from '@trezor/type-utils';
import { isNotNull, isNotNullOrUndefined, typedObjectKeys } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './constants';

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
        dispatch(deviceActions.removeButtonRequests({ path: device?.path }));
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
        {
            accountKey,
            tokenContract,
            feeLevelLabel,
            feePerUnit,
            feeLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
        },
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

        if (maxFeePerGas) {
            draftCopy.maxFeePerGas = maxFeePerGas;
        }
        if (maxPriorityFeePerGas) {
            draftCopy.maxPriorityFeePerGas = maxPriorityFeePerGas;
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
                message: 'Payload is undefined.',
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

            extra.services.analytics.report({
                type: sharedEvents.transactionCreatedEvent.name,
                payload: getTransactionCreatedEventPayload({
                    action: 'sent',
                    account: selectedAccount,
                    precomposedForm: formValues,
                    tokens: tokenSymbol ?? '',
                }),
            });
        }

        return fulfillWithValue(sendResponse.payload);
    },
);
