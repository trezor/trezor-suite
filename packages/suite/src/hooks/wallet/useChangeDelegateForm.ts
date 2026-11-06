import { createContext, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    getStakeFormsDefaultValues,
    getStakingContractAddress,
    selectBaseCurrency,
    selectRawNetworkFeeInfo,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import {
    type ChangeDelegateFormState,
    type SelectedAccountLoaded,
} from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { signTransactionThunk } from 'src/actions/wallet/stakeActions';
import { useSelector } from 'src/hooks/suite';
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
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const { account, network } = selectedAccount;

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );

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
        }),
        [account, network, feeInfo, defaultValues],
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
        hasComposeError,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useStakeCompose({
        ...methods,
        formState,
        state,
    });

    const composeRequestRef = useCurrentRef(composeRequest);

    useEffect(() => {
        composeRequestRef.current();
    }, [composeRequestRef, selectedVotingDelegation]);

    const { changeFeeLevel, selectedFee: _selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
        formState,
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

        if (composedTx?.type === 'final') {
            const result = await dispatch(
                signTransactionThunk({
                    accountKey: account.key,
                    formValues: values,
                    transactionInfo: composedTx,
                }),
            ).catch((error: unknown) => {
                dispatch(stakeActions.requestSignTransaction());
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: translationString('TR_STAKING_ERROR_GENERIC'),
                    }),
                );
                console.warn(
                    'Change delegate signing failed',
                    error instanceof Error ? error.name : 'UnknownError',
                );

                return undefined;
            });

            if (result?.success) {
                clearForm();
            }
        }
    }, [
        getValues,
        composedLevels,
        dispatch,
        account.key,
        clearForm,
        selectedFee,
        translationString,
    ]);

    return {
        ...methods,
        methods,
        account,
        network,
        formState,
        register,
        baseCurrencyCode,
        composedLevels,
        hasComposeError,
        retryCompose: composeRequest,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        feeInfo,
        changeFeeLevel,
    };
};
