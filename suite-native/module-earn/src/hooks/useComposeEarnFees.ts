import { useCallback, useEffect, useRef } from 'react';
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
    type UpdateSelectedFeeLevelThunkParams,
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
    const formDraftRef = useRef(formDraft);
    formDraftRef.current = formDraft;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const composeFeeLevels = useCallback(async () => {
        if (!formState || !account || !feeInfo) return;

        const { selectedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas } =
            formDraftRef.current ?? {};

        const mergedFormState = {
            ...formState,
            selectedFee: selectedFee ?? formState.selectedFee,
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
    }, [dispatch, formState, account, feeInfo, saveDraft]);

    useEffect(() => {
        debounce(composeFeeLevels);
    }, [debounce, composeFeeLevels]);

    return { formDraft, formDraftKey, updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk };
};
