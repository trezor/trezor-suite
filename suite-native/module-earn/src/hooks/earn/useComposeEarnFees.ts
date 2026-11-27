import { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type FormDraftRootState,
    WALLET_SDK_SOURCE_MOBILE,
    composeSendFormTransactionFeeLevelsThunk,
    composeSolanaStakingTransactionFeeLevelsThunk,
    formDraftActions,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
    useFormDraft,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { haveSolanaStakingAccountsChanged } from '@suite-common/wallet-utils';
import {
    type NativeSendRootState,
    type UpdateSelectedFeeLevelThunkParams,
    getFeeAvailability,
    hasNewCustomFee,
    isPrecomposedTransactionError,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce } from '@trezor/react-utils';
import { createThunk, injectDispatch, injectGetState } from '@trezor/redux-utils';
import { deepEqual } from '@trezor/utils';

import { useEarnFeeAnalytics } from './useEarnFeeAnalytics';
import { useEarnFeeEstimationError } from './useEarnFeeEstimationError';
import { EARN_MODULE_PREFIX } from '../../constants';
import { type EarnFormDraftPrefix } from '../../types';
import { validateEarnCustomFee } from '../../utils/earn/validateEarnCustomFee';

export type UpdateEarnSelectedFeeLevelThunkState = FormDraftRootState & NativeSendRootState;

export const updateEarnSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateEarnSelectedFeeLevelThunkState }
>(
    `${EARN_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
    ({ feeLevelLabel, formDraftKey }, { dispatch, getState }) => {
        if (!formDraftKey) return;
        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey);
        const preview = selectFeeLevels(getState())[feeLevelLabel];
        if (!formDraft || !isFinalPrecomposedTransaction(preview)) return;

        dispatch(
            formDraftActions.storeDraft({
                key: formDraftKey,
                formDraft: {
                    ...formDraft,
                    selectedFee: feeLevelLabel,
                    feePerUnit: preview.feePerByte,
                    feeLimit: preview.feeLimit ?? '',
                    maxFeePerGas: preview.maxFeePerGas,
                    maxPriorityFeePerGas: preview.maxPriorityFeePerGas,
                },
            }),
        );
    },
);

type UseComposeEarnFeesParams = {
    accountKey: AccountKey;
    formState: FormState | undefined;
    formDraftPrefix: EarnFormDraftPrefix;
};

const selectCompositionInputs = (
    state: AccountsRootState & FeesRootState,
    accountKey: AccountKey,
    formDraftPrefix: EarnFormDraftPrefix,
) => {
    const account = selectAccountByKey(state, accountKey);
    const feeInfo = selectConvertedNetworkFeeInfo(state, account?.symbol);
    if (!account || !feeInfo) return null;

    const { symbol, key, networkType, availableBalance, misc } = account;
    if (networkType === 'solana' && formDraftPrefix === 'claim') {
        return {
            kind: 'solana-claim' as const,
            symbol,
            key,
            availableBalance,
            stakeAccounts: misc?.solStakingAccounts,
            externalStakeAccounts: misc?.solExternalStakingAccounts,
            feeLevels: feeInfo.levels,
        };
    }

    return { kind: 'other' as const, symbol, account, feeInfo };
};

type CompositionInputs = ReturnType<typeof selectCompositionInputs>;

const areCompositionInputsEqual = (previous: CompositionInputs, current: CompositionInputs) => {
    if (previous?.kind !== 'solana-claim' || current?.kind !== 'solana-claim') {
        return shallowEqual(previous, current);
    }

    return (
        previous.key === current.key &&
        previous.symbol === current.symbol &&
        previous.availableBalance === current.availableBalance &&
        !haveSolanaStakingAccountsChanged(previous.stakeAccounts, current.stakeAccounts ?? []) &&
        !haveSolanaStakingAccountsChanged(
            previous.externalStakeAccounts,
            current.externalStakeAccounts ?? [],
        ) &&
        deepEqual(previous.feeLevels, current.feeLevels)
    );
};

// Triggers fee level composition for earn flows and stores the draft so `<FeeSelector>` can read it.
export const useComposeEarnFees = ({
    accountKey,
    formState,
    formDraftPrefix,
}: UseComposeEarnFeesParams) => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const debounce = useDebounce();
    const isFocused = useIsFocused();
    const {
        draft: formDraft,
        formDraftKey,
        saveDraft,
        removeDraft,
    } = useFormDraft<FormState>(formDraftPrefix, accountKey);
    const [isComposingFeeLevels, setIsComposingFeeLevels] = useState(true);
    const requestIdRef = useRef(0);
    const [composedForm, setComposedForm] = useState<UseComposeEarnFeesParams>();
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useEarnFeeEstimationError(formDraftKey);
    const compositionInputs = useSelector(
        (state: AccountsRootState & FeesRootState) =>
            selectCompositionInputs(state, accountKey, formDraftPrefix),
        areCompositionInputsEqual,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const isCurrentComposition =
        composedForm?.accountKey === accountKey &&
        composedForm.formDraftPrefix === formDraftPrefix &&
        composedForm.formState === formState;
    const selectedFee = formDraft?.selectedFee;
    const customFeePerUnit = selectedFee === 'custom' ? formDraft?.feePerUnit : undefined;
    const customFeeLimit = selectedFee === 'custom' ? formDraft?.feeLimit : undefined;
    const customMaxFeePerGas = selectedFee === 'custom' ? formDraft?.maxFeePerGas : undefined;
    const customMaxPriorityFeePerGas =
        selectedFee === 'custom' ? formDraft?.maxPriorityFeePerGas : undefined;
    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;

    const composeFeeLevels = useCallback(
        async (requestId: number) => {
            if (requestId !== requestIdRef.current) return;

            const account = selectAccountByKey(getState(), accountKey);
            const feeInfo = selectConvertedNetworkFeeInfo(getState(), account?.symbol);
            if (!formState || !account || !feeInfo) return;

            const draftAtStart = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
                FormState | undefined;
            const {
                selectedFee: draftSelectedFee,
                feePerUnit,
                feeLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
            } = draftAtStart ?? {};

            const mergedFormState = {
                ...formState,
                selectedFee: draftSelectedFee ?? formState.selectedFee,
                feePerUnit: feePerUnit ?? formState.feePerUnit,
                feeLimit: feeLimit ?? formState.feeLimit,
                maxFeePerGas: maxFeePerGas ?? formState.maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas ?? formState.maxPriorityFeePerGas,
            };

            try {
                const response =
                    account.networkType === 'solana'
                        ? await dispatch(
                              composeSolanaStakingTransactionFeeLevelsThunk({
                                  accountKey,
                                  stakeType: formDraftPrefix,
                                  amount: mergedFormState.outputs?.[0]?.amount ?? '',
                                  source: WALLET_SDK_SOURCE_MOBILE,
                              }),
                          )
                        : await dispatch(
                              composeSendFormTransactionFeeLevelsThunk({
                                  formState: mergedFormState,
                                  composeContext: {
                                      account,
                                      feeInfo,
                                      network: getNetwork(account.symbol),
                                  },
                              }),
                          );

                if (requestId !== requestIdRef.current) return;

                const latestDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
                    FormState | undefined;
                if (hasNewCustomFee(mergedFormState, latestDraft)) return;

                if (
                    !isFulfilled(response) ||
                    !response.payload?.normal ||
                    (response.payload.normal.type === 'error' &&
                        (response.payload.normal.error === 'TR_STAKE_TX_PREPARATION_FAILED' ||
                            response.payload.normal.error === 'TR_STAKE_SOL_FEE_ESTIMATE_INVALID' ||
                            !isPrecomposedTransactionError(response.payload.normal.error)))
                ) {
                    setHasFeeEstimationError(true);
                    dispatch(
                        transactionManagementActions.storeFeeLevels({
                            feeLevels: {},
                        }),
                    );

                    return;
                }

                const { custom } = response.payload;
                const composedFeeLevels =
                    account.networkType === 'ethereum' && isFinalPrecomposedTransaction(custom)
                        ? { ...response.payload, custom: validateEarnCustomFee(custom) }
                        : response.payload;
                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: composedFeeLevels }),
                );

                setComposedForm({ accountKey, formDraftPrefix, formState });

                const normalLevel = response.payload.normal;
                if (!mergedFormState.feePerUnit && isFinalPrecomposedTransaction(normalLevel)) {
                    mergedFormState.feePerUnit = normalLevel.feePerByte;
                }

                // Read the live selection even if its React update has not rendered yet.
                saveDraft({
                    ...mergedFormState,
                    selectedFee: latestDraft?.selectedFee ?? mergedFormState.selectedFee,
                });
            } catch {
                const latestDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
                    FormState | undefined;
                if (
                    requestId === requestIdRef.current &&
                    !hasNewCustomFee(mergedFormState, latestDraft)
                ) {
                    setHasFeeEstimationError(true);
                    dispatch(
                        transactionManagementActions.storeFeeLevels({
                            feeLevels: {},
                        }),
                    );
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsComposingFeeLevels(false);
                }
            }
        },
        [
            dispatch,
            getState,
            formDraftKey,
            formState,
            saveDraft,
            accountKey,
            formDraftPrefix,
            setHasFeeEstimationError,
        ],
    );

    useEffect(() => {
        removeDraft();
    }, [removeDraft]);

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        if (!isFocused) {
            setComposedForm(undefined);

            return;
        }
        dispatch(transactionManagementActions.clearFeeLevels());
        setHasFeeEstimationError(false);
        setIsComposingFeeLevels(!!formState && !!compositionInputs);
        debounce(() => composeFeeLevels(requestId));
    }, [
        isFocused,
        dispatch,
        accountKey,
        formDraftKey,
        compositionInputs,
        debounce,
        composeFeeLevels,
        formState,
        feeEstimationRetryKey,
        customFeePerUnit,
        customFeeLimit,
        customMaxFeePerGas,
        customMaxPriorityFeePerGas,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
        },
        [],
    );

    const isCurrentFeeComposing =
        isComposingFeeLevels || (!!formState && !isCurrentComposition && !hasFeeEstimationError);
    const { isFeeUnavailable } = getFeeAvailability({
        feeLevels,
        selectedFee,
        isLoading: isCurrentFeeComposing,
    });
    const isFeeReady =
        !!formState &&
        isCurrentComposition &&
        !isComposingFeeLevels &&
        !hasFeeEstimationError &&
        isFinalPrecomposedTransaction(selectedFeeLevel);
    const retryWithAnalytics = useEarnFeeAnalytics({
        contextKey: formDraftKey,
        flow: formDraftPrefix,
        networkSymbol: compositionInputs?.symbol,
        isEnabled: isFocused && !!formState,
        hasEstimationError: hasFeeEstimationError,
        isFeeUnavailable,
        isReady: isFeeReady,
        retry: retryFeeEstimation,
    });

    return {
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        retryFeeEstimation: retryWithAnalytics,
        isComposingFeeLevels: isCurrentFeeComposing,
        isFeeReady,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
