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
    selectAreFeesLoading,
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
    isPrecomposedTransactionError,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce } from '@trezor/react-utils';
import { createThunk, injectDispatch } from '@trezor/redux-utils';

import { EARN_MODULE_PREFIX } from '../../constants';
import { type EarnFormDraftPrefix } from '../../types';
import { useYieldFeeEstimationError } from '../yield/useYieldFeeEstimationError';

export type UpdateEarnSelectedFeeLevelThunkState = FormDraftRootState;

export const updateEarnSelectedFeeLevelThunk = createThunk<
    void,
    UpdateSelectedFeeLevelThunkParams,
    { state: UpdateEarnSelectedFeeLevelThunkState }
>(
    `${EARN_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        { feeLevelLabel, feePerUnit, feeLimit, formDraftKey, maxFeePerGas, maxPriorityFeePerGas },
        { dispatch, getState },
    ) => {
        if (!formDraftKey) return;
        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey);
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
    const { dispatch } = useServices(injectDispatch);
    const debounce = useDebounce();
    const isFocused = useIsFocused();
    const {
        draft: formDraft,
        formDraftKey,
        saveDraft,
    } = useFormDraft<FormState>(formDraftPrefix, accountKey);
    const [isComposingFeeLevels, setIsComposingFeeLevels] = useState(true);
    const formDraftRef = useRef(formDraft);
    formDraftRef.current = formDraft;
    const requestIdRef = useRef(0);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useYieldFeeEstimationError();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const selectedFee = formDraft?.selectedFee;
    const customFeePerUnit = selectedFee === 'custom' ? formDraft?.feePerUnit : undefined;
    const customFeeLimit = selectedFee === 'custom' ? formDraft?.feeLimit : undefined;
    const customMaxFeePerGas = selectedFee === 'custom' ? formDraft?.maxFeePerGas : undefined;
    const customMaxPriorityFeePerGas =
        selectedFee === 'custom' ? formDraft?.maxPriorityFeePerGas : undefined;
    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    const { isFeeUnavailable } = getFeeAvailability({
        feeLevels,
        selectedFee,
        isLoading: areFeesLoading || isComposingFeeLevels,
    });

    const composeFeeLevels = useCallback(
        async (requestId: number) => {
            if (requestId !== requestIdRef.current) return;

            if (!formState || !account || !feeInfo) {
                if (requestId === requestIdRef.current) {
                    setIsComposingFeeLevels(false);
                }

                return;
            }

            setIsComposingFeeLevels(true);

            try {
                const {
                    selectedFee: draftSelectedFee,
                    feePerUnit,
                    feeLimit,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                } = formDraftRef.current ?? {};

                const mergedFormState = {
                    ...formState,
                    selectedFee: draftSelectedFee ?? formState.selectedFee,
                    feePerUnit: feePerUnit ?? formState.feePerUnit,
                    feeLimit: feeLimit ?? formState.feeLimit,
                    maxFeePerGas: maxFeePerGas ?? formState.maxFeePerGas,
                    maxPriorityFeePerGas: maxPriorityFeePerGas ?? formState.maxPriorityFeePerGas,
                };

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

                if (
                    !isFulfilled(response) ||
                    !response.payload?.normal ||
                    (response.payload.normal.type === 'error' &&
                        !isPrecomposedTransactionError(response.payload.normal.error))
                ) {
                    setHasFeeEstimationError(true);
                    dispatch(transactionManagementActions.clearFeeLevels());

                    return;
                }

                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: response.payload }),
                );

                const normalLevel = response.payload.normal;
                if (!mergedFormState.feePerUnit && isFinalPrecomposedTransaction(normalLevel)) {
                    mergedFormState.feePerUnit = normalLevel.feePerByte;
                }

                // A standard selection can change while all levels are being composed.
                saveDraft({
                    ...mergedFormState,
                    selectedFee: formDraftRef.current?.selectedFee ?? mergedFormState.selectedFee,
                });
            } catch {
                if (requestId === requestIdRef.current) {
                    setHasFeeEstimationError(true);
                    dispatch(transactionManagementActions.clearFeeLevels());
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsComposingFeeLevels(false);
                }
            }
        },
        [
            dispatch,
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
        if (isFocused) dispatch(transactionManagementActions.clearFeeLevels());
    }, [dispatch, formDraftKey, isFocused]);

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        if (!isFocused) return;
        setHasFeeEstimationError(false);
        setIsComposingFeeLevels(!!formState && !!account && !!feeInfo);
        debounce(() => composeFeeLevels(requestId));
    }, [
        isFocused,
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

    const isFeeReady =
        !!formState &&
        !isComposingFeeLevels &&
        !hasFeeEstimationError &&
        isFinalPrecomposedTransaction(selectedFeeLevel);

    return {
        formDraft,
        formDraftKey,
        isFeeUnavailable: formState !== undefined && !isComposingFeeLevels && isFeeUnavailable,
        hasFeeEstimationError,
        retryFeeEstimation,
        isComposingFeeLevels,
        isFeeReady,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
