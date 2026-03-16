import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { getStakeFormsDefaultValues, getStakingContractAddress } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type Account, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type ClaimContextValues, type ClaimFormState } from 'src/types/earn/claimForm';
import { CRYPTO_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';

import { useCardanoStaking } from './useCardanoStaking';
import { useFees } from '../wallet/form/useFees';
import { useStakeCompose } from '../wallet/form/useStakeCompose';

export const ClaimFormContext = createContext<ClaimContextValues | null>(null);
ClaimFormContext.displayName = 'ClaimFormContext';

type UseClaimFormsProps = {
    account: Account;
};

export const useClaimForm = ({ account }: UseClaimFormsProps): ClaimContextValues => {
    const dispatch = useDispatch();

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
    });
    const selectedFee = _selectedFee ?? 'normal';

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

    const { calculateFeeAndDeposit, withdrawingAvailable } = useCardanoStaking();
    const isClaimingDisabled = !withdrawingAvailable.status;

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

export const useClaimFormContext = () => {
    const ctx = useContext(ClaimFormContext);
    if (ctx === null) throw Error('useClaimFormContext used without Context');

    return ctx;
};
