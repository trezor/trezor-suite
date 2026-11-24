import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDebounce } from 'react-use';

import { formatStakingAmount, useStakingAccountPosition } from '@suite-common/earn-staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    getStakeFormsDefaultValues,
    getStakingContractAddress,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectRawNetworkFeeInfo,
    simulateUnstake,
    useFormDraft,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getConvertedOrDefaultFeeInfo,
    getFiatRateKey,
    isPositiveBalance,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber, isChanged, throwError } from '@trezor/utils';

import { useSignStakingTransaction } from '#src/hooks/earn/useSignStakingTransaction';
import { useSelector } from '#src/hooks/suite/useSelector';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from '#src/types/earn/earnFormFields';
import type { AmountLimitProps } from '#src/utils/suite/validation';

import { useRevalidateAmountOnBalanceChange } from './useRevalidateAmountOnBalanceChange';
import {
    type WithdrawalContextValues as WithdrawalContextValuesBase,
    type WithdrawalFormState,
} from '../../components/earn/forms/StakeFormContext';
import { useFees } from '../wallet/form/useFees';
import { useStakeCompose } from '../wallet/form/useStakeCompose';

type WithdrawalContextValues = WithdrawalContextValuesBase & {
    /** What the position holds to unstake, in the network's main unit. */
    unstakableBalance: string;
    /** A Cardano account with nothing spendable cannot pay the deregistration fee. */
    isCardanoBalanceEmpty: boolean;
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
    const signStakingTransaction = useSignStakingTransaction(account);
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

    // The form validates against the amount it shows: the staked balance of the position.
    const { totals } = useStakingAccountPosition(account.key);
    const unstakableBalance = formatStakingAmount({ amount: totals.staked, networkSymbol: symbol });

    // The staked balance includes the reward balance, which the deregistration withdraws in the
    // same transaction, so the fee check reads the spendable balance alone.
    const isCardanoBalanceEmpty =
        account.networkType === 'cardano' && !isPositiveBalance(account.availableBalance);

    const amountLimits: AmountLimitProps = {
        currency: symbol,
        maxCrypto: unstakableBalance,
        maxFiat:
            toFiatCurrency({ amount: unstakableBalance, rate: currentRate?.rate })?.toFixed(2) ??
            undefined,
    };

    const stakingContractAddress = getStakingContractAddress(account, 'unstake');

    // Keyed on strings: the modal passes a fresh account object on every account update, and new
    // default values reset the untouched fields of a form that has no draft yet.
    const defaultValues = useMemo(
        () =>
            getStakeFormsDefaultValues({
                address: stakingContractAddress,
                stakeType: 'unstake',
                amount: unstakableBalance,
            }) as WithdrawalFormState,
        [stakingContractAddress, unstakableBalance],
    );

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

    const { register, control, formState, setValue, reset, getValues, clearErrors, trigger } =
        methods;

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

    // A typed amount survives a balance change; the revalidation below checks it against the new
    // balance.
    useEffect(() => {
        if (!isDraft && defaultValues) {
            reset(defaultValues, { keepDirtyValues: true, keepDirty: true });
        }
    }, [reset, isDraft, defaultValues]);

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

    useRevalidateAmountOnBalanceChange({
        stakedBalance: unstakableBalance,
        getValues,
        trigger,
        composeRequest,
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
            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true, shouldValidate: true });

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

            const amount = new BigNumber(unstakableBalance)
                .dividedBy(divisor)
                .decimalPlaces(network.decimals)
                .toString();

            setValue(CRYPTO_INPUT, amount, { shouldDirty: true, shouldValidate: true });
            await onCryptoAmountChange(amount);
        },
        [unstakableBalance, clearErrors, network.decimals, onCryptoAmountChange, setValue],
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

        await signStakingTransaction({
            formValues: values,
            transactionInfo: composedTx?.type === 'final' ? composedTx : undefined,
            refreshComposition: composeRequest,
            onSuccess: clearForm,
        });
    }, [getValues, composedLevels, signStakingTransaction, clearForm, composeRequest, selectedFee]);

    return {
        ...methods,
        methods, // Todo: check, this seems as a mistake
        account,
        network,
        formState,
        register,
        unstakableBalance,
        isCardanoBalanceEmpty,
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

export const useWithdrawalFormContext = () =>
    useContext(WithdrawalFormContext) ??
    throwError('useWithdrawalFormContext used without Context');
