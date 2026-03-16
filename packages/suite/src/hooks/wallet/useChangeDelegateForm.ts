import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { getStakeFormsDefaultValues, getStakingContractAddress } from '@suite-common/staking';
import {
    selectBaseCurrency,
    selectRawNetworkFeeInfo,
    selectVotingDelegationOption,
} from '@suite-common/wallet-core';
import {
    type ChangeDelegateFormState,
    type PrecomposedTransactionFinal,
    type SelectedAccountLoaded,
} from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT } from 'src/types/earn/earnFormFields';

import { useFees } from './form/useFees';
import { useStakeCompose } from './form/useStakeCompose';
import { type ChangeDelegateContextValues } from '../../components/earn/forms/ChangeDelegateFormContext';

export const ChangeDelegateFormContext = createContext<ChangeDelegateContextValues | null>(null);
ChangeDelegateFormContext.displayName = 'ChangeDelegateFormContext';

type UseChangeDelegateFormsProps = {
    selectedAccount: SelectedAccountLoaded;
};

export const useChangeDelegateForm = ({
    selectedAccount,
}: UseChangeDelegateFormsProps): ChangeDelegateContextValues => {
    const dispatch = useDispatch();

    const { account, network } = selectedAccount;

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: rawFeeInfo,
    });

    const defaultValues = useMemo(() => {
        const stakingContractAddress = getStakingContractAddress(account, 'change-delegate');

        return {
            ...getStakeFormsDefaultValues({
                address: stakingContractAddress,
                stakeType: 'change-delegate',
            }),
        } as ChangeDelegateFormState;
    }, [account]);

    const state = useMemo(
        () => ({
            account,
            network,
            feeInfo,
            formValues: defaultValues,
            selectedVotingDelegation,
        }),
        [account, network, feeInfo, defaultValues, selectedVotingDelegation],
    );

    const methods = useForm<ChangeDelegateFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, formState, reset, getValues, clearErrors } = methods;

    // react-hook-form reset, set default values
    useEffect(() => {
        if (defaultValues) {
            reset(defaultValues);
        }
    }, [reset, defaultValues]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useStakeCompose({
        ...methods,
        state,
    });

    const { changeFeeLevel, selectedFee: _selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });
    const selectedFee = _selectedFee ?? 'normal';

    const clearForm = useCallback(async () => {
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, defaultValues, reset]);

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
    }, [getValues, composedLevels, dispatch, clearForm, selectedFee]);

    return {
        ...methods,
        methods,
        account,
        network,
        formState,
        register,
        baseCurrencyCode,
        composedLevels,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        feeInfo,
        changeFeeLevel,
    };
};

export const useChangeDelegateFormContext = () => {
    const ctx = useContext(ChangeDelegateFormContext);
    if (ctx === null) throw Error('useChangeDelegateFormContext used without Context');

    return ctx;
};
