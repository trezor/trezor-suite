import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';

import {
    getStakeFormsDefaultValues,
    getStakingContractAddress,
    simulateUnstake,
} from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectRawNetworkFeeInfo,
    useFormDraft,
} from '@suite-common/wallet-core';
import { Account, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getConvertedOrDefaultFeeInfo,
    getFiatRateKey,
    getStakingDataForNetwork,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber, isChanged } from '@trezor/utils';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';
import type { AmountLimitProps } from 'src/utils/suite/validation';

import {
    WithdrawalContextValues as WithdrawalContextValuesBase,
    WithdrawalFormState,
} from '../../components/earn/forms/SupplyFormContext';
import { useFees } from '../wallet/form/useFees';
import { useStakeCompose } from '../wallet/form/useStakeCompose';

type WithdrawalContextValues = WithdrawalContextValuesBase & {
    amountLimits: AmountLimitProps;
    approximatedInstantEthAmount?: string | null;
    setRatioAmount: (divisor: number) => void;
    currency?: 'crypto' | 'fiat';
    setCurrency: (currency: 'crypto' | 'fiat') => void;
};

export const WithdrawalFormContext = createContext<WithdrawalContextValues | null>(null);
WithdrawalFormContext.displayName = 'WithdrawalFormContext';

type UseWithdrawalFormProps = {
    account: Account;
};

export const useWithdrawalForm = ({ account }: UseWithdrawalFormProps): WithdrawalContextValues => {
    const dispatch = useDispatch();
    const [approximatedInstantEthAmount, setApproximatedInstantEthAmount] = useState<string | null>(
        null,
    );

    const network = getNetwork(account.symbol);
    const { symbol } = account;

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: rawFeeInfo,
    });

    const [currency, setCurrency] = useState<'crypto' | 'fiat' | undefined>(undefined);

    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(symbol, baseCurrencyCode), 'current'),
    );

    const { autocompoundBalance = '0' } = getStakingDataForNetwork(account) ?? {};
    const amountLimits: AmountLimitProps = {
        currency: symbol,
        maxCrypto: autocompoundBalance,
        maxFiat:
            toFiatCurrency({ amount: autocompoundBalance, rate: currentRate?.rate })?.toFixed(2) ??
            undefined,
    };

    const defaultValues = useMemo(() => {
        const stakingContractAddress = getStakingContractAddress(account, 'unstake');

        return {
            ...getStakeFormsDefaultValues({
                address: stakingContractAddress,
                stakeType: 'unstake',
                amount: autocompoundBalance,
            }),
        } as WithdrawalFormState;
    }, [account, autocompoundBalance]);

    const { saveDraft, draft, removeDraft } = useFormDraft<WithdrawalFormState>(
        'unstake',
        account.key,
    );
    const isDraft = !!draft;

    const state = useMemo(
        () => ({
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        }),
        [account, network, feeInfo, defaultValues],
    );

    const methods = useForm<WithdrawalFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, setValue, reset, getValues, clearErrors } = methods;

    const values = useWatch<WithdrawalFormState>({ control });

    useEffect(() => {
        const { cryptoInput } = values;

        if (
            !cryptoInput ||
            new BigNumber(cryptoInput).lte(0) ||
            Object.keys(formState.errors).length
        ) {
            setApproximatedInstantEthAmount(null);

            return;
        }

        const simulateUnstakeAmount = async () => {
            const approximatedEthAmount = await simulateUnstake({
                amount: cryptoInput,
                from: account.descriptor,
                symbol: account.symbol,
            });
            setApproximatedInstantEthAmount(approximatedEthAmount);
        };

        simulateUnstakeAmount();
    }, [account.symbol, account.descriptor, formState.errors, values]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft();
        }
    }, [values, removeDraft, defaultValues]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
    }, [register]);

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

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(values as WithdrawalFormState);
            }
        },
        200,
        [
            saveDraft,
            values,
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            isComposing,
        ],
    );

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            if (currentRate) {
                const fiatValue = toFiatCurrency({ amount, rate: currentRate?.rate })?.toFixed(
                    2,
                    BigNumber.ROUND_FLOOR,
                );
                setValue(FIAT_INPUT, fiatValue || '', {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }

            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true, shouldValidate: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, currentRate, setValue],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            if (!currentRate) return;

            const cryptoValue = fromBaseCurrencyToCryptoUnit({
                fiatAmount: amount,
                rate: currentRate?.rate,
            })?.toFixed(network.decimals);

            setValue(CRYPTO_INPUT, cryptoValue || '', { shouldDirty: true, shouldValidate: true });
            setValue(OUTPUT_AMOUNT, cryptoValue || '', {
                shouldDirty: true,
                shouldValidate: true,
            });
            await composeRequest(FIAT_INPUT);
        },
        [composeRequest, currentRate, network.decimals, setValue],
    );

    const setRatioAmount = useCallback(
        async (divisor: number) => {
            setValue(CRYPTO_INPUT, undefined, { shouldDirty: true });
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);

            const amount = new BigNumber(autocompoundBalance)
                .dividedBy(divisor)
                .decimalPlaces(network.decimals)
                .toString();

            setValue(CRYPTO_INPUT, amount, { shouldDirty: true, shouldValidate: true });
            await onCryptoAmountChange(amount);
        },
        [autocompoundBalance, clearErrors, network.decimals, onCryptoAmountChange, setValue],
    );

    const clearForm = useCallback(async () => {
        removeDraft();
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, defaultValues, removeDraft, reset]);

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
        methods, // Todo: check, this seems as a mistake
        account,
        network,
        formState,
        register,
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        baseCurrencyCode,
        composedLevels,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        setRatioAmount,
        currentRate,
        feeInfo,
        changeFeeLevel,
        approximatedInstantEthAmount,
        currency,
        setCurrency,
    };
};

export const useWithdrawalFormContext = () => {
    const ctx = useContext(WithdrawalFormContext);
    if (ctx === null) throw Error('useWithdrawalFormContext used without Context');

    return ctx;
};
