import { useCallback, useEffect, useMemo } from 'react';
import { DefaultValues, useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';

import { getFeeLevels, getFiatRateKey } from '@suite-common/wallet-utils';
import { isChanged } from '@suite-common/suite-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useFormDraft } from './useFormDraft';

import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

import {
    PrecomposedTransactionFinal,
    FormState,
    SelectedAccountLoaded,
    FormDraftKeyPrefix,
} from '@suite-common/wallet-types';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { useFees } from './form/useFees';
import { useEthCompose } from './form/useCompose';
import { ThunkAction } from 'src/types/suite';

export interface UseCommonEthFormProps<TFormState extends FormState> {
    selectedAccount: SelectedAccountLoaded;
    defaultValues: DefaultValues<TFormState>;
    draftKey: FormDraftKeyPrefix;
    signTransaction: (values: TFormState, composedTx: PrecomposedTransactionFinal) => ThunkAction;
}

export const useCommonEthForm = <TFormState extends FormState>({
    draftKey,
    selectedAccount,
    defaultValues,
    signTransaction,
}: UseCommonEthFormProps<TFormState>) => {
    const dispatch = useDispatch();

    const { account, network } = selectedAccount;
    const { symbol } = account;

    const localCurrency = useSelector(selectLocalCurrency);
    const symbolFees = useSelector(state => state.wallet.fees[symbol]);

    const symbolForFiat = mapTestnetSymbol(symbol);
    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(symbolForFiat, localCurrency),
            'current',
        ),
    );

    const state = useMemo(() => {
        const levels = getFeeLevels(account.networkType, symbolFees);
        const feeInfo = { ...symbolFees, levels };

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, defaultValues, symbolFees, network]);

    const { saveDraft, getDraft, removeDraft } = useFormDraft<TFormState>(draftKey);
    const draft = getDraft(account.key) as DefaultValues<TFormState> | undefined;
    const isDraft = !!draft;

    const methods = useForm<TFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { control, formState, reset, getValues } = methods;

    const values = useWatch<TFormState>({ control });

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [values, removeDraft, account.key, defaultValues]);

    // react-hook-form reset, set default values
    useEffect(() => {
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, isDraft, defaultValues]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useEthCompose({
        ...methods,
        state,
    });

    // sub-hook, FeeLevels handler
    const fees = useSelector(state => state.wallet.fees);
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const { changeFeeLevel, selectedFee: _selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });
    const selectedFee = _selectedFee ?? 'normal';

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(selectedAccount.account.key, values as TFormState);
            }
        },
        200,
        [
            saveDraft,
            selectedAccount.account.key,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    const clearForm = useCallback(async () => {
        removeDraft(account.key);
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [account.key, composeRequest, defaultValues, removeDraft, reset]);

    // get response from TransactionReviewModal
    const signTx = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels ? composedLevels[selectedFee] : undefined;
        if (composedTx && composedTx.type === 'final') {
            const result = await dispatch(
                signTransaction(values, composedTx as PrecomposedTransactionFinal),
            );

            if (result?.success) {
                clearForm();
            }
        }
    }, [getValues, composedLevels, dispatch, clearForm, selectedFee, signTransaction]);

    return {
        account,
        network,
        state,
        methods,
        values,
        clearForm,
        // drafts
        draft,
        removeDraft,
        isDraft,
        // rates
        currentRate,
        localCurrency,
        selectedFee,
        changeFeeLevel,
        feeInfo,
        // compose
        isComposing,
        composedLevels,
        composeRequest,
        signTx,
    };
};
