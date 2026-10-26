import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

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

import { useEarnFeeAnalytics } from './useEarnFeeAnalytics';
import { useEarnFeeEstimationError } from './useEarnFeeEstimationError';
import { EARN_MODULE_PREFIX } from '../../constants';
import { type EarnFormDraftPrefix } from '../../types';

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
    } = useFormDraft<FormState>(formDraftPrefix, accountKey);
    const [isComposingFeeLevels, setIsComposingFeeLevels] = useState(true);
    const requestIdRef = useRef(0);
    const [composedForm, setComposedForm] = useState<UseComposeEarnFeesParams>();
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useEarnFeeEstimationError();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
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

                dispatch(
                    transactionManagementActions.storeFeeLevels({
                        feeLevels: response.payload,
                    }),
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
            account,
            feeInfo,
            saveDraft,
            accountKey,
            formDraftPrefix,
            setHasFeeEstimationError,
        ],
    );

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        if (!isFocused) return;
        dispatch(transactionManagementActions.clearFeeLevels());
        setHasFeeEstimationError(false);
        setIsComposingFeeLevels(!!formState && !!account && !!feeInfo);
        debounce(() => composeFeeLevels(requestId));
    }, [
        isFocused,
        dispatch,
        accountKey,
        formDraftKey,
        account,
        debounce,
        composeFeeLevels,
        feeInfo,
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
        networkSymbol: account?.symbol,
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
