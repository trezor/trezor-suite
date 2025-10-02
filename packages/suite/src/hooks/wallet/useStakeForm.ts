import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import { fromWei } from 'web3-utils';

import { getStakeFormsDefaultValues, getStakingContractAddress } from '@suite-common/staking';
import {
    StakeContextValues,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectRawNetworkFeeInfo,
    useFormDraft,
} from '@suite-common/wallet-core';
import {
    PrecomposedTransactionFinal,
    SelectedAccountLoaded,
    StakeFormState,
} from '@suite-common/wallet-types';
import {
    StakingLimits,
    fromBaseCurrencyToCryptoUnit,
    getConvertedOrDefaultFeeInfo,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { isChanged } from '@trezor/utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/wallet/stakeForms';
import type { AmountLimitProps } from 'src/utils/suite/validation';

import { useFees } from './form/useFees';
import { useStakeCompose } from './form/useStakeCompose';

export const StakeFormContext = createContext<StakeContextValues | null>(null);
StakeFormContext.displayName = 'StakeFormContext';

type UseStakeFormsProps = {
    selectedAccount: SelectedAccountLoaded;
    stakingLimits: StakingLimits;
};

export const useStakeForm = ({
    selectedAccount,
    stakingLimits,
}: UseStakeFormsProps): StakeContextValues => {
    const dispatch = useDispatch();

    const { account, network } = selectedAccount;

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const networkFees = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));

    const [currency, setCurrency] = useState<'crypto' | 'fiat' | undefined>(undefined);

    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(account.symbol, baseCurrencyCode),
            'current',
        ),
    );

    const amountLimits: AmountLimitProps = {
        currency: account.symbol,
        minCrypto: stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
        maxCrypto: account.formattedBalance,
        minFiat:
            toFiatCurrency({
                amount: stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
                rate: currentRate?.rate,
            })?.toFixed(2) ?? undefined,
        maxFiat:
            toFiatCurrency({
                amount: account.formattedBalance,
                rate: currentRate?.rate,
            })?.toFixed(2) ?? undefined,
    };

    const defaultValues = useMemo(() => {
        const stakingContractAddress = getStakingContractAddress(account, 'stake');

        return {
            ...getStakeFormsDefaultValues({
                address: stakingContractAddress,
                stakeType: 'stake',
            }),
            setMaxOutputId: undefined,
        } as StakeFormState;
    }, [account]);

    const { saveDraft, draft, removeDraft } = useFormDraft<StakeFormState>('stake', account.key);
    const isDraft = !!draft;

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

    const methods = useForm<StakeFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, setValue, reset, clearErrors, getValues } = methods;

    const values = useWatch<StakeFormState>({ control });

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft();
        }
    }, [values, removeDraft, defaultValues]);

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register('setMaxOutputId');
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

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(values as StakeFormState);
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

    const [isAmountForWithdrawalWarningShown, setIsAmountForWithdrawalWarningShown] =
        useState(false);
    const [isLessAmountForWithdrawalWarningShown, setIsLessAmountForWithdrawalWarningShown] =
        useState(false);
    const [isAdviceForWithdrawalWarningShown, setIsAdviceForWithdrawalWarningShown] =
        useState(false);

    const composedFee = useMemo(() => {
        const transactionInfo = composedLevels?.[selectedFee];

        return transactionInfo !== undefined && transactionInfo.type !== 'error'
            ? new BigNumber(fromWei(transactionInfo.fee, 'ether'))
            : new BigNumber('0');
    }, [composedLevels, selectedFee]);

    const clearWithdrawalWarnings = useCallback(() => {
        setIsAmountForWithdrawalWarningShown(false);
        setIsLessAmountForWithdrawalWarningShown(false);
        setIsAdviceForWithdrawalWarningShown(false);
    }, []);

    const shouldShowAdvice = useCallback(
        (amount: string, formattedBalance: string) => {
            const cryptoValue = new BigNumber(amount);
            const balance = new BigNumber(formattedBalance);
            const balanceMinusFee = balance.minus(composedFee);

            if (
                cryptoValue.gt(balanceMinusFee.minus(stakingLimits.MIN_FOR_WITHDRAWALS)) &&
                cryptoValue.lt(balanceMinusFee) &&
                cryptoValue.gte(stakingLimits.MIN_AMOUNT_FOR_STAKING)
            ) {
                setIsAdviceForWithdrawalWarningShown(true);
            }
        },
        [composedFee, stakingLimits.MIN_FOR_WITHDRAWALS, stakingLimits.MIN_AMOUNT_FOR_STAKING],
    );

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            clearWithdrawalWarnings();

            if (currentRate) {
                const fiatValue =
                    toFiatCurrency({ amount, rate: currentRate?.rate })?.toFixed(2) || '';

                setValue(FIAT_INPUT, fiatValue, { shouldValidate: true });
            }

            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);

            shouldShowAdvice(amount, account.formattedBalance);
        },
        [
            account.formattedBalance,
            composeRequest,
            currentRate,
            setValue,
            shouldShowAdvice,
            clearWithdrawalWarnings,
        ],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearWithdrawalWarnings();
            if (!currentRate) return;

            const cryptoValue =
                fromBaseCurrencyToCryptoUnit({
                    fiatAmount: amount,
                    rate: currentRate?.rate,
                })?.toFixed(network.decimals) || '';

            setValue(CRYPTO_INPUT, cryptoValue, { shouldDirty: true, shouldValidate: true });
            setValue(OUTPUT_AMOUNT, cryptoValue, {
                shouldDirty: true,
            });
            await composeRequest(FIAT_INPUT);

            shouldShowAdvice(cryptoValue, account.formattedBalance);
        },
        [
            account.formattedBalance,
            composeRequest,
            currentRate,
            network.decimals,
            setValue,
            shouldShowAdvice,
            clearWithdrawalWarnings,
        ],
    );

    const setRatioAmount = useCallback(
        async (divisor: number) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
            clearWithdrawalWarnings();

            const amount = new BigNumber(account.formattedBalance)
                .dividedBy(divisor)
                .decimalPlaces(network.decimals)
                .toString();

            setValue(CRYPTO_INPUT, amount, { shouldDirty: true, shouldValidate: true });
            await onCryptoAmountChange(amount);
        },
        [
            account.formattedBalance,
            clearErrors,
            network.decimals,
            onCryptoAmountChange,
            setValue,
            clearWithdrawalWarnings,
        ],
    );

    const setMax = useCallback(async () => {
        setIsAdviceForWithdrawalWarningShown(false);
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);

        const amount = new BigNumber(account.formattedBalance).toString();

        if (amount < stakingLimits.MIN_BALANCE_FOR_STAKING.toString()) {
            setIsLessAmountForWithdrawalWarningShown(true);
        }

        setValue(
            OUTPUT_AMOUNT,
            new BigNumber(amount).minus(stakingLimits.MIN_FOR_WITHDRAWALS).toString() || '',
            {
                shouldDirty: true,
            },
        );

        await composeRequest(CRYPTO_INPUT);
        setIsAmountForWithdrawalWarningShown(true);
    }, [
        account.formattedBalance,
        clearErrors,
        composeRequest,
        setValue,
        stakingLimits.MIN_BALANCE_FOR_STAKING,
        stakingLimits.MIN_FOR_WITHDRAWALS,
    ]);

    useEffect(() => {
        if (formState.errors[CRYPTO_INPUT]) {
            setIsAmountForWithdrawalWarningShown(false);
            setIsLessAmountForWithdrawalWarningShown(false);
        }
    }, [formState]);

    const clearForm = useCallback(async () => {
        removeDraft();
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
        clearWithdrawalWarnings();
    }, [composeRequest, defaultValues, removeDraft, reset, clearWithdrawalWarnings]);

    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee;
        const composed = composedLevels[selectedFeeLevel];
        if (!composed) return;

        if (composed.type === 'final') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                const { max } = composed;

                setValue(CRYPTO_INPUT, max, { shouldValidate: true, shouldDirty: true });
                setValue(OUTPUT_AMOUNT, max, { shouldValidate: true, shouldDirty: true });
                clearErrors(CRYPTO_INPUT);

                const fiatValue = currentRate
                    ? toFiatCurrency({ amount: max, rate: currentRate?.rate })?.toFixed(2)
                    : '';

                setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true, shouldDirty: true });
            }

            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [clearErrors, composedLevels, getValues, setValue, selectedFee, currentRate]);

    const [isLoading, setIsLoading] = useState(false);
    // get response from TransactionReviewModal
    const signTx = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels ? composedLevels[selectedFee] : undefined;
        if (composedTx && composedTx.type === 'final') {
            setIsLoading(true);
            const result = await dispatch(
                signTransaction(values, composedTx as PrecomposedTransactionFinal),
            );

            setIsLoading(false);
            if (result?.success) {
                clearForm();
            }
        }
    }, [getValues, composedLevels, dispatch, clearForm, selectedFee]);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
    };

    const onSubmit = () => {
        setIsConfirmModalOpen(true);
    };

    return {
        ...methods,
        onSubmit,
        account,
        network,
        removeDraft,
        formState,
        isDraft,
        register,
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        baseCurrencyCode,
        composedLevels,
        isComposing,
        setMax,
        setRatioAmount,
        isAmountForWithdrawalWarningShown,
        isLessAmountForWithdrawalWarningShown,
        isAdviceForWithdrawalWarningShown,
        selectedFee,
        feeInfo,
        changeFeeLevel,
        clearForm,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        currentRate,
        isLoading,
        currency,
        setCurrency,
    };
};

export const useStakeFormContext = () => {
    const ctx = useContext(StakeFormContext);
    if (ctx === null) throw Error('useStakeFormContext used without Context');

    return ctx;
};
