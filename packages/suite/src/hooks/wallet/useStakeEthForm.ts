import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import BigNumber from 'bignumber.js';
import useDebounce from 'react-use/lib/useDebounce';

import {
    fromFiatCurrency,
    getFeeLevels,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { isChanged } from '@suite-common/suite-utils';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    UseStakeFormsProps,
    FIAT_INPUT,
    CRYPTO_INPUT,
    OUTPUT_AMOUNT,
} from 'src/types/wallet/stakeForms';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useFormDraft } from './useFormDraft';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

import { fromWei } from 'web3-utils';
import { useStakeCompose } from './form/useStakeCompose';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
} from 'src/constants/suite/ethStaking';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    PrecomposedTransactionFinal,
    StakeFormState,
    StakeContextValues,
} from '@suite-common/wallet-types';
import { getEthNetworkForWalletSdk, getStakeFormsDefaultValues } from 'src/utils/suite/stake';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';

export const StakeEthFormContext = createContext<StakeContextValues | null>(null);
StakeEthFormContext.displayName = 'StakeEthFormContext';

export const useStakeEthForm = ({ selectedAccount }: UseStakeFormsProps): StakeContextValues => {
    const dispatch = useDispatch();

    const localCurrency = useSelector(selectLocalCurrency);
    const fees = useSelector(state => state.wallet.fees);

    const { account, network } = selectedAccount;
    const { symbol } = account;

    const symbolForFiat = mapTestnetSymbol(symbol);
    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(symbolForFiat, localCurrency),
            'current',
        ),
    );
    // TODO: Implement fee switcher
    const selectedFee = 'normal';

    const amountLimits: AmountLimits = {
        currency: symbol,
        minCrypto: MIN_ETH_AMOUNT_FOR_STAKING.toNumber(),
        maxCrypto: Number(account.formattedBalance),
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

    const { saveDraft, getDraft, removeDraft } = useFormDraft<StakeFormState>('stake-eth');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const state = useMemo(() => {
        const coinFees = fees[account.symbol];
        const levels = getFeeLevels(account.networkType, coinFees);
        const feeInfo = { ...coinFees, levels };

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, defaultValues, fees, network]);

    const methods = useForm<StakeFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, setValue, reset, clearErrors, getValues, setError } =
        methods;

    const values = useWatch<StakeFormState>({ control });

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [values, removeDraft, account.key, defaultValues]);

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
    } = useStakeCompose({
        ...methods,
        state,
    });

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0 &&
                !isComposing
            ) {
                saveDraft(selectedAccount.account.key, values as StakeFormState);
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

    const [isAmountForWithdrawalWarningShown, setIsAmountForWithdrawalWarningShown] =
        useState(false);
    const [isAdviceForWithdrawalWarningShown, setIsAdviceForWithdrawalWarningShown] =
        useState(false);

    // TODO: Add more extra fee to ensure tx success when staking logic is implemented
    const composedFee = useMemo(() => {
        const transactionInfo = composedLevels?.[selectedFee];
        return transactionInfo !== undefined && transactionInfo.type !== 'error'
            ? new BigNumber(fromWei(transactionInfo.fee))
            : new BigNumber('0');
    }, [composedLevels]);

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
            if (!currentRate) return;

            const fiatValue = toFiatCurrency(amount, localCurrency, {
                [currentRate.locale]: currentRate?.rate,
            });
            setValue('setMaxOutputId', undefined, { shouldDirty: true });
            setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
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
                    [currentRate.locale]: currentRate?.rate,
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
        removeDraft(account.key);
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
        setIsAdviceForWithdrawalWarningShown(false);
        setIsAmountForWithdrawalWarningShown(false);
    }, [account.key, composeRequest, defaultValues, removeDraft, reset]);

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
                          [currentRate.locale]: currentRate?.rate,
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
        setError,
        setValue,
        selectedFee,
        translationString,
        localCurrency,
        composedFee,
        account.formattedBalance,
        currentRate,
    ]);

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
    }, [getValues, composedLevels, dispatch, clearForm]);

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
        clearForm,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
    };
};

export const useStakeEthFormContext = () => {
    const ctx = useContext(StakeEthFormContext);
    if (ctx === null) throw Error('useStakeEthFormContext used without Context');
    return ctx;
};
