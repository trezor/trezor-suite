import { createContext, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { getNetwork } from '@suite-common/wallet-config';
import {
    getStakeFormsDefaultValues,
    getStakingContractAddress,
    selectBaseCurrency,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { useSignStakingTransaction } from '#src/hooks/earn/useSignStakingTransaction';
import { useSelector } from '#src/hooks/suite/useSelector';
import { type ClaimContextValues, type ClaimFormState } from '#src/types/earn/claimForm';
import { CRYPTO_INPUT, OUTPUT_AMOUNT } from '#src/types/earn/earnFormFields';

import { useCardanoStaking } from './useCardanoStaking';
import { useFees } from '../wallet/form/useFees';
import { useStakeCompose } from '../wallet/form/useStakeCompose';

export const ClaimFormContext = createContext<ClaimContextValues | null>(null);
ClaimFormContext.displayName = 'ClaimFormContext';

type UseClaimFormsProps = {
    account: Account;
};

export const useClaimForm = ({ account }: UseClaimFormsProps): ClaimContextValues => {
    const signStakingTransaction = useSignStakingTransaction(account);

    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const network = getNetwork(account.symbol);
    const networkFees = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));

    const defaultValues = useMemo(() => {
        const stakingContractAddress = getStakingContractAddress(account, 'claim');

        return {
            ...getStakeFormsDefaultValues({
                address: stakingContractAddress,
                stakeType: 'claim',
            }),
        } as ClaimFormState;
    }, [account]);

    const state = useMemo(() => {
        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: networkFees,
        });

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, defaultValues, networkFees, network]);

    const methods = useForm<ClaimFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, formState, setValue, reset, getValues, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register(CRYPTO_INPUT);
    }, [register]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useStakeCompose({
        ...methods,
        formState,
        state,
    });

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, setValue],
    );

    const onClaimChange = useCallback(
        async (amount: string) => {
            clearErrors([CRYPTO_INPUT]);
            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            await onCryptoAmountChange(amount);
        },
        [clearErrors, onCryptoAmountChange, setValue],
    );

    const clearForm = useCallback(async () => {
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, defaultValues, reset]);

    // sub-hook, FeeLevels handler
    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: networkFees,
    });
    const { changeFeeLevel, selectedFee: _selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
        formState,
    });
    const selectedFee = _selectedFee ?? 'normal';

    const { calculateFeeAndDeposit, withdrawingAvailable } = useCardanoStaking({ account });
    const isClaimingDisabled = !withdrawingAvailable.status;

    // get response from TransactionReviewModal
    const signTx = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels ? composedLevels[selectedFee] : undefined;

        await signStakingTransaction({
            formValues: values,
            transactionInfo:
                composedTx?.type === 'final' &&
                (account.networkType !== 'cardano' || !isClaimingDisabled)
                    ? composedTx
                    : undefined,
            refreshComposition: async () => {
                await composeRequest();
                if (account.networkType === 'cardano') await calculateFeeAndDeposit('withdrawal');
            },
            onSuccess: clearForm,
        });
    }, [
        getValues,
        composedLevels,
        signStakingTransaction,
        clearForm,
        composeRequest,
        selectedFee,
        account.networkType,
        calculateFeeAndDeposit,
        isClaimingDisabled,
    ]);

    useEffect(() => {
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit]);

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
        onClaimChange,
        feeInfo,
        changeFeeLevel,
        isClaimingDisabled,
    };
};
