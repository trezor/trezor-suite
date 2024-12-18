import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';

import {
    fromFiatCurrency,
    getFeeInfo,
    getFiatRateKey,
    getStakingDataForNetwork,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { isChanged } from '@suite-common/suite-utils';
import {
    selectFiatRatesByFiatRateKey,
    UnstakeContextValues as UnstakeContextValuesBase,
    UnstakeFormState,
} from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    CRYPTO_INPUT,
    FIAT_INPUT,
    OUTPUT_AMOUNT,
    UseStakeFormsProps,
} from 'src/types/wallet/stakeForms';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    getEthNetworkAddresses,
    getStakeFormsDefaultValues,
    simulateUnstake,
} from 'src/utils/suite/ethereumStaking';
import type { AmountLimitProps } from 'src/utils/suite/validation';

import { useStakeCompose } from './form/useStakeCompose';
import { useFormDraft } from './useFormDraft';
import { useFees } from './form/useFees';

type UnstakeOptions = 'all' | 'rewards' | 'other';

type UnstakeContextValues = UnstakeContextValuesBase & {
    amountLimits: AmountLimitProps;
    approximatedInstantEthAmount?: string | null;
    unstakeOption: UnstakeOptions;
    setUnstakeOption: (option: UnstakeOptions) => void;
};

export const UnstakeEthFormContext = createContext<UnstakeContextValues | null>(null);
UnstakeEthFormContext.displayName = 'UnstakeEthFormContext';

export const useUnstakeEthForm = ({
    selectedAccount,
}: UseStakeFormsProps): UnstakeContextValues => {
    const dispatch = useDispatch();
    const [approximatedInstantEthAmount, setApproximatedInstantEthAmount] = useState<string | null>(
        null,
    );
    const [unstakeOption, setUnstakeOption] = useState<UnstakeOptions>('all');

    const { account, network } = selectedAccount;
    const { symbol } = account;

    const localCurrency = useSelector(selectLocalCurrency);
    const symbolFees = useSelector(state => state.wallet.fees[symbol]);

    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(symbol, localCurrency), 'current'),
    );

    const { autocompoundBalance = '0' } = getStakingDataForNetwork(account) ?? {};
    const amountLimits: AmountLimitProps = {
        currency: symbol,
        maxCrypto: autocompoundBalance,
    };

    const defaultValues = useMemo(() => {
        const { addressContractPool } = getEthNetworkAddresses(account.symbol);

        return {
            ...getStakeFormsDefaultValues({
                address: addressContractPool,
                stakeType: 'unstake',
                amount: autocompoundBalance,
            }),
        } as UnstakeFormState;
    }, [account.symbol, autocompoundBalance]);

    const { saveDraft, getDraft, removeDraft } = useFormDraft<UnstakeFormState>('unstake-eth');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const state = useMemo(() => {
        const feeInfo = getFeeInfo({
            networkType: account.networkType,
            feeInfo: symbolFees,
        });

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, defaultValues, symbolFees, network]);

    const methods = useForm<UnstakeFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, setValue, reset, getValues, clearErrors } = methods;

    const values = useWatch<UnstakeFormState>({ control });

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
            removeDraft(account.key);
        }
    }, [values, removeDraft, account.key, defaultValues]);

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

    // sub-hook, FeeLevels handler
    const fees = useSelector(state => state.wallet.fees);
    const feeInfo = getFeeInfo({
        networkType: account.networkType,
        feeInfo: fees[account.symbol],
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
                saveDraft(selectedAccount.account.key, values as UnstakeFormState);
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

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            if (currentRate) {
                const fiatValue = toFiatCurrency(amount, currentRate?.rate);
                setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
            }

            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, currentRate, setValue],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            if (!currentRate) return;

            const cryptoValue = fromFiatCurrency(amount, network.decimals, currentRate?.rate);
            setValue(CRYPTO_INPUT, cryptoValue || '', { shouldDirty: true, shouldValidate: true });
            setValue(OUTPUT_AMOUNT, cryptoValue || '', {
                shouldDirty: true,
            });
            await composeRequest(FIAT_INPUT);
        },
        [composeRequest, currentRate, network.decimals, setValue],
    );

    const onOptionChange = useCallback(
        async (amount: string) => {
            clearErrors([CRYPTO_INPUT, FIAT_INPUT]);
            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            await onCryptoAmountChange(amount);
        },
        [clearErrors, onCryptoAmountChange, setValue],
    );

    const clearForm = useCallback(async () => {
        removeDraft(account.key);
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [account.key, composeRequest, defaultValues, removeDraft, reset]);

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
        account,
        network,
        formState,
        register,
        amountLimits,
        onCryptoAmountChange,
        onFiatAmountChange,
        localCurrency,
        composedLevels,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        onOptionChange,
        currentRate,
        feeInfo,
        changeFeeLevel,
        approximatedInstantEthAmount,
        unstakeOption,
        setUnstakeOption,
    };
};

export const useUnstakeEthFormContext = () => {
    const ctx = useContext(UnstakeEthFormContext);
    if (ctx === null) throw Error('useUnstakeEthFormContext used without Context');

    return ctx;
};
