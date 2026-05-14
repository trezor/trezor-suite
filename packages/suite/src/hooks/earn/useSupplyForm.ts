import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import { fromWei } from 'web3-utils';

import { getStakeFormsDefaultValues, getStakingContractAddress } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectRawNetworkFeeInfo,
    useFormDraft,
} from '@suite-common/wallet-core';
import {
    type Account,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getConvertedOrDefaultFeeInfo,
    getFiatRateKey,
    getStakingLimitsByNetworkSymbol,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { isChanged } from '@trezor/utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';
import type { AmountLimitProps } from 'src/utils/suite/validation';

import { useCardanoStaking } from './useCardanoStaking';
import { type SupplyContextValues } from '../../components/earn/forms/SupplyFormContext';
import { useFees } from '../wallet/form/useFees';
import { useStakeCompose } from '../wallet/form/useStakeCompose';

export const SupplyFormContext = createContext<SupplyContextValues | null>(null);
SupplyFormContext.displayName = 'SupplyFormContext';

type UseSupplyFormProps = {
    account: Account;
};

export const useSupplyForm = ({ account }: UseSupplyFormProps): SupplyContextValues => {
    const dispatch = useDispatch();
    const network = getNetwork(account.symbol);

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

    const stakingLimits = useMemo(
        () => getStakingLimitsByNetworkSymbol(account.symbol),
        [account.symbol],
    );

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

    const composedFee = useMemo(() => {
        const transactionInfo = composedLevels?.[selectedFee];

        return transactionInfo !== undefined && transactionInfo.type !== 'error'
            ? new BigNumber(fromWei(transactionInfo.fee, 'ether'))
            : new BigNumber('0');
    }, [composedLevels, selectedFee]);

    const amountLimits: AmountLimitProps | undefined = useMemo(() => {
        if (stakingLimits === null) {
            return;
        }

        const maxCrypto = new BigNumber(account.formattedBalance)
            .minus(stakingLimits.MIN_BALANCE_FOR_FEE_BUFFER)
            .toString();

        return {
            currency: account.symbol,
            minCrypto: stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
            maxCrypto,
            minFiat:
                toFiatCurrency({
                    amount: stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
                    rate: currentRate?.rate,
                })?.toFixed(2, BigNumber.ROUND_CEIL) ?? undefined,
            maxFiat:
                toFiatCurrency({ amount: maxCrypto, rate: currentRate?.rate })?.toFixed(2) ??
                undefined,
        };
    }, [stakingLimits, account.symbol, account.formattedBalance, currentRate?.rate]);

    const showAdviceBanner = useMemo(() => {
        const amount = new BigNumber(values.cryptoInput || '0');
        const balance = new BigNumber(account.formattedBalance || '0');
        const balanceMinusFee = balance.minus(composedFee);

        return (
            stakingLimits != null &&
            amount.gt(balanceMinusFee.minus(stakingLimits.MIN_FOR_WITHDRAWALS)) &&
            amount.lt(balanceMinusFee) &&
            amount.gte(stakingLimits.MIN_AMOUNT_FOR_STAKING)
        );
    }, [stakingLimits, values.cryptoInput, account.formattedBalance, composedFee]);

    const { isAmountForWithdrawalWarningShown, isLessAmountForWithdrawalWarningShown } =
        useMemo(() => {
            const isSetMax = values.setMaxOutputId != undefined;
            if (!isSetMax || !stakingLimits) {
                return {
                    isAmountForWithdrawalWarningShown: false,
                    isLessAmountForWithdrawalWarningShown: false,
                };
            }

            const balance = new BigNumber(account.formattedBalance || '0');
            const amount = new BigNumber(values.cryptoInput || '0');
            const diff = balance.minus(amount);

            return {
                isAmountForWithdrawalWarningShown: diff.gte(stakingLimits.MIN_FOR_WITHDRAWALS),
                isLessAmountForWithdrawalWarningShown: diff.lt(stakingLimits.MIN_FOR_WITHDRAWALS),
            };
        }, [values.setMaxOutputId, values.cryptoInput, stakingLimits, account.formattedBalance]);

    const onCryptoAmountChange = useCallback(
        async (amount: string, source: 'input' | 'max' = 'input') => {
            if (currentRate) {
                const fiatValue =
                    toFiatCurrency({ amount, rate: currentRate?.rate })?.toFixed(2) || '';

                setValue(FIAT_INPUT, fiatValue, { shouldValidate: true });
            }

            if (source != 'max') {
                setValue('setMaxOutputId', undefined, { shouldDirty: true });
            }
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, currentRate, setValue],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });

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
        },
        [composeRequest, currentRate, network.decimals, setValue],
    );

    const setRatioAmount = useCallback(
        async (divisor: number) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);

            const amount = new BigNumber(account.formattedBalance)
                .dividedBy(divisor)
                .decimalPlaces(network.decimals)
                .toString();

            setValue(CRYPTO_INPUT, amount, { shouldDirty: true, shouldValidate: true });
            await onCryptoAmountChange(amount);
        },
        [account.formattedBalance, clearErrors, network.decimals, onCryptoAmountChange, setValue],
    );

    const setMax = useCallback(async () => {
        if (amountLimits == null || stakingLimits == null) {
            return;
        }

        setValue('setMaxOutputId', 0, { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);

        let amount = new BigNumber(amountLimits.maxCrypto ?? '');

        if (amount.gt(stakingLimits.MIN_BALANCE_FOR_STAKING)) {
            amount = new BigNumber(account.formattedBalance).minus(
                stakingLimits.MIN_FOR_WITHDRAWALS,
            );
        }

        setValue(CRYPTO_INPUT, amount.toString(), { shouldDirty: true, shouldValidate: true });

        await onCryptoAmountChange(amount.toString(), 'max');
    }, [
        account.formattedBalance,
        amountLimits,
        clearErrors,
        onCryptoAmountChange,
        setValue,
        stakingLimits,
    ]);

    const clearForm = useCallback(async () => {
        removeDraft();
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, defaultValues, removeDraft, reset]);

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
        if (network.networkType === 'cardano') {
            signTx();
        } else {
            setIsConfirmModalOpen(true);
        }
    };

    const { isStakingDisabled, calculateFeeAndDeposit } = useCardanoStaking();

    useEffect(() => {
        calculateFeeAndDeposit('delegate');
    }, [calculateFeeAndDeposit]);

    return {
        ...methods,
        methods,
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
        stakingLimits,
        setMax,
        setRatioAmount,
        isAmountForWithdrawalWarningShown,
        isLessAmountForWithdrawalWarningShown,
        showAdviceBanner,
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
        isStakingDisabled,
    };
};

export const useSupplyFormContext = () => {
    const ctx = useContext(SupplyFormContext);
    if (ctx === null) throw Error('useSupplyFormContext used without Context');

    return ctx;
};
