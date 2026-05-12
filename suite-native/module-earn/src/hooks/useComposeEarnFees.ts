import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    composeSendFormTransactionFeeLevelsThunk,
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
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import { EARN_MODULE_PREFIX } from '../constants';
import { type EarnFormDraftPrefix } from '../types';

export const updateEarnSelectedFeeLevelThunk = createThunk(
    `${EARN_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
    (
        {
            feeLevelLabel,
            feePerUnit,
            feeLimit,
            formDraftKey,
            maxFeePerGas,
            maxPriorityFeePerGas,
        }: UpdateSelectedFeeLevelThunkParams,
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
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const {
        draft: formDraft,
        formDraftKey,
        saveDraft,
    } = useFormDraft<FormState>(formDraftPrefix, accountKey);
    const [isComposingFeeLevels, setIsComposingFeeLevels] = useState(false);
    const formDraftRef = useRef(formDraft);
    formDraftRef.current = formDraft;
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
    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const { isFeeUnavailable } = getFeeAvailability({
        fee,
        feeLevels,
        selectedFee,
        isLoading: areFeesLoading || isComposingFeeLevels,
    });

    const composeFeeLevels = useCallback(async () => {
        if (!formState || !account || !feeInfo) {
            setIsComposingFeeLevels(false);

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

            const response = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: mergedFormState,
                    composeContext: { account, feeInfo, network: getNetwork(account.symbol) },
                }),
            );
            if (!isFulfilled(response)) return;

            dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: response.payload }));

            const normalLevel = response.payload.normal;
            if (!mergedFormState.feePerUnit && isFinalPrecomposedTransaction(normalLevel)) {
                mergedFormState.feePerUnit = normalLevel.feePerByte;
            }

            saveDraft(mergedFormState);
        } finally {
            setIsComposingFeeLevels(false);
        }
    }, [dispatch, formState, account, feeInfo, saveDraft]);

    useEffect(() => {
        setIsComposingFeeLevels(!!formState && !!account && !!feeInfo);
        debounce(composeFeeLevels);
    }, [account, debounce, composeFeeLevels, feeInfo, formState]);

    return {
        formDraft,
        formDraftKey,
        isFeeUnavailable: formState !== undefined && !isComposingFeeLevels && isFeeUnavailable,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
