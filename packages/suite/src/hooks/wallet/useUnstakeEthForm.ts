import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
    fromFiatCurrency,
    getFeeLevels,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    CRYPTO_INPUT,
    FIAT_INPUT,
    OUTPUT_AMOUNT,
    UseStakeFormsProps,
} from 'src/types/wallet/stakeForms';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

import { useStakeCompose } from './form/useStakeCompose';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    PrecomposedTransactionFinal,
    UnstakeContextValues as UnstakeContextValuesBase,
    UnstakeFormState,
} from '@suite-common/wallet-types';
import { getEthNetworkForWalletSdk, getStakeFormsDefaultValues } from 'src/utils/suite/stake';
import { useFormDraft } from './useFormDraft';
import useDebounce from 'react-use/lib/useDebounce';
import { isChanged } from '@suite-common/suite-utils';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { useStakeAndRewards } from './useStakeAndRewards';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';

type UnstakeContextValues = UnstakeContextValuesBase & {
    amountLimits: AmountLimits;
};

export const UnstakeEthFormContext = createContext<UnstakeContextValues | null>(null);
UnstakeEthFormContext.displayName = 'UnstakeEthFormContext';

export const useUnstakeEthForm = ({
    selectedAccount,
}: UseStakeFormsProps): UnstakeContextValues => {
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

    const { stakeWithRewards } = useStakeAndRewards();
    const amountLimits: AmountLimits = {
        currency: symbol,
        minCrypto: MIN_ETH_AMOUNT_FOR_STAKING.toNumber(),
        maxCrypto: stakeWithRewards.toNumber(),
    };

    const defaultValues = useMemo(() => {
        const { address_pool: poolAddress } = Ethereum.selectNetwork(
            getEthNetworkForWalletSdk(account.symbol),
        );

        return {
            ...getStakeFormsDefaultValues({
                address: poolAddress,
                ethereumStakeType: 'unstake',
            }),
        } as UnstakeFormState;
    }, [account.symbol]);

    const { saveDraft, getDraft, removeDraft } = useFormDraft<UnstakeFormState>('unstake-eth');
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

    const methods = useForm<UnstakeFormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, setValue, reset, getValues, clearErrors } = methods;

    const values = useWatch<UnstakeFormState>({ control });

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
            if (!currentRate) return;

            const fiatValue = toFiatCurrency(amount, localCurrency, {
                [currentRate.locale]: currentRate?.rate,
            });

            setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, currentRate, localCurrency, setValue],
    );

    const onFiatAmountChange = useCallback(
        async (amount: string) => {
            if (!currentRate) return;

            const cryptoValue = fromFiatCurrency(
                amount,
                localCurrency,
                { [currentRate.locale]: currentRate?.rate },
                network.decimals,
            );
            setValue(CRYPTO_INPUT, cryptoValue || '', { shouldDirty: true, shouldValidate: true });
            setValue(OUTPUT_AMOUNT, cryptoValue || '', {
                shouldDirty: true,
            });
            await composeRequest(FIAT_INPUT);
        },
        [composeRequest, currentRate, localCurrency, network.decimals, setValue],
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
    }, [getValues, composedLevels, dispatch, clearForm]);

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
    };
};

export const useUnstakeEthFormContext = () => {
    const ctx = useContext(UnstakeEthFormContext);
    if (ctx === null) throw Error('useUnstakeEthFormContext used without Context');
    return ctx;
};
