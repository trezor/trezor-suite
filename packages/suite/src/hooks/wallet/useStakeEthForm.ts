import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { fromFiatCurrency, toFiatCurrency } from '@suite-common/wallet-utils';

import { useDispatch, useTranslation } from 'src/hooks/suite';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    UseStakeFormsProps,
    FIAT_INPUT,
    CRYPTO_INPUT,
    OUTPUT_AMOUNT,
} from 'src/types/wallet/stakeForms';

import { fromWei } from 'web3-utils';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
} from 'src/constants/suite/ethStaking';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { StakeFormState, StakeContextValues, AmountLimitsString } from '@suite-common/wallet-types';
import { getEthNetworkForWalletSdk, getStakeFormsDefaultValues } from 'src/utils/suite/stake';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { useCommonEthForm } from './useCommonEthForm';

export const StakeEthFormContext = createContext<StakeContextValues | null>(null);
StakeEthFormContext.displayName = 'StakeEthFormContext';

export const useStakeEthForm = ({ selectedAccount }: UseStakeFormsProps): StakeContextValues => {
    const dispatch = useDispatch();

    const { account, network } = selectedAccount;
    const { symbol } = account;

    const amountLimits: AmountLimitsString = {
        currency: symbol,
        minCrypto: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
        maxCrypto: account.formattedBalance,
    };

    const defaultValues = useMemo(() => {
        const { address_pool: poolAddress } = Ethereum.selectNetwork(
            getEthNetworkForWalletSdk(account.symbol),
        );

        return {
            ...getStakeFormsDefaultValues({
                address: poolAddress,
                ethereumStakeType: 'stake',
            }),
            setMaxOutputId: undefined,
        } as StakeFormState;
    }, [account.symbol]);

    const {
        methods,
        clearForm: clearFormCommon,
        localCurrency,
        currentRate,
        selectedFee,
        changeFeeLevel,
        isComposing,
        composedLevels,
        composeRequest,
        removeDraft,
        isDraft,
        signTx,
        feeInfo,
    } = useCommonEthForm<StakeFormState>({
        draftKey: 'stake-eth',
        defaultValues,
        selectedAccount,
        signTransaction,
    });
    const { register, formState, getValues, setValue, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register('setMaxOutputId');
    }, [register]);

    const [isAmountForWithdrawalWarningShown, setIsAmountForWithdrawalWarningShown] =
        useState(false);
    const [isAdviceForWithdrawalWarningShown, setIsAdviceForWithdrawalWarningShown] =
        useState(false);

    const composedFee = useMemo(() => {
        const transactionInfo = composedLevels?.[selectedFee];

        return transactionInfo !== undefined && transactionInfo.type !== 'error'
            ? new BigNumber(fromWei(transactionInfo.fee))
            : new BigNumber('0');
    }, [composedLevels, selectedFee]);

    const shouldShowAdvice = useCallback(
        (amount: string, formattedBalance: string) => {
            const cryptoValue = new BigNumber(amount);
            const balance = new BigNumber(formattedBalance);
            const balanceMinusFee = balance.minus(composedFee);

            if (
                cryptoValue.gt(balanceMinusFee.minus(MIN_ETH_FOR_WITHDRAWALS)) &&
                cryptoValue.lt(balanceMinusFee) &&
                cryptoValue.gt(MIN_ETH_AMOUNT_FOR_STAKING)
            ) {
                setIsAdviceForWithdrawalWarningShown(true);
            }
        },
        [composedFee],
    );

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            setIsAmountForWithdrawalWarningShown(false);
            setIsAdviceForWithdrawalWarningShown(false);

            if (currentRate) {
                const fiatValue = toFiatCurrency(amount, localCurrency, {
                    [localCurrency]: currentRate?.rate,
                });
                setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
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
            localCurrency,
            setValue,
            shouldShowAdvice,
        ],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setIsAmountForWithdrawalWarningShown(false);
            setIsAdviceForWithdrawalWarningShown(false);
            if (!currentRate) return;

            const cryptoValue = fromFiatCurrency(
                amount,
                localCurrency,
                {
                    [localCurrency]: currentRate?.rate,
                },
                network.decimals,
            );
            setValue(CRYPTO_INPUT, cryptoValue || '', { shouldDirty: true, shouldValidate: true });
            setValue(OUTPUT_AMOUNT, cryptoValue || '', {
                shouldDirty: true,
            });
            await composeRequest(FIAT_INPUT);

            shouldShowAdvice(cryptoValue || '', account.formattedBalance);
        },
        [
            account.formattedBalance,
            composeRequest,
            currentRate,
            localCurrency,
            network.decimals,
            setValue,
            shouldShowAdvice,
        ],
    );

    const setRatioAmount = useCallback(
        async (divisor: number) => {
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
            setIsAmountForWithdrawalWarningShown(false);
            setIsAdviceForWithdrawalWarningShown(false);

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
        setIsAdviceForWithdrawalWarningShown(false);
        setValue('setMaxOutputId', 0, { shouldDirty: true });
        clearErrors([FIAT_INPUT, CRYPTO_INPUT]);
        const amount = new BigNumber(account.formattedBalance)
            .minus(MIN_ETH_FOR_WITHDRAWALS)
            .toString();
        setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
        await composeRequest(CRYPTO_INPUT);
        setIsAmountForWithdrawalWarningShown(true);
    }, [account.formattedBalance, clearErrors, composeRequest, setValue]);

    const clearForm = useCallback(async () => {
        await clearFormCommon();
        setIsAdviceForWithdrawalWarningShown(false);
        setIsAmountForWithdrawalWarningShown(false);
    }, [clearFormCommon]);

    const { translationString } = useTranslation();
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
                    ? toFiatCurrency(max, localCurrency, {
                          [localCurrency]: currentRate?.rate,
                      })
                    : '';
                setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true, shouldDirty: true });
            }

            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [
        clearErrors,
        composedLevels,
        dispatch,
        getValues,
        setValue,
        selectedFee,
        translationString,
        localCurrency,
        composedFee,
        account.formattedBalance,
        currentRate,
    ]);

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
        localCurrency,
        composedLevels,
        isComposing,
        setMax,
        setRatioAmount,
        isAmountForWithdrawalWarningShown,
        isAdviceForWithdrawalWarningShown,
        selectedFee,
        feeInfo,
        changeFeeLevel,
        clearForm,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        currentRate,
    };
};

export const useStakeEthFormContext = () => {
    const ctx = useContext(StakeEthFormContext);
    if (ctx === null) throw Error('useStakeEthFormContext used without Context');

    return ctx;
};
