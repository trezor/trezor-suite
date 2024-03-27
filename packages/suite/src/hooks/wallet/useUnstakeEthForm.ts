import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { fromFiatCurrency, toFiatCurrency } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import {
    CRYPTO_INPUT,
    FIAT_INPUT,
    OUTPUT_AMOUNT,
    UseStakeFormsProps,
} from 'src/types/wallet/stakeForms';

import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    AmountLimitsString,
    UnstakeContextValues as UnstakeContextValuesBase,
    UnstakeFormState,
} from '@suite-common/wallet-types';
import { getEthNetworkForWalletSdk, getStakeFormsDefaultValues } from 'src/utils/suite/stake';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { selectSelectedAccountAutocompoundBalance } from '../../reducers/wallet/selectedAccountReducer';
import { useCommonEthForm } from './useCommonEthForm';

type UnstakeContextValues = UnstakeContextValuesBase & {
    amountLimits: AmountLimitsString;
};

export const UnstakeEthFormContext = createContext<UnstakeContextValues | null>(null);
UnstakeEthFormContext.displayName = 'UnstakeEthFormContext';

export const useUnstakeEthForm = ({
    selectedAccount,
}: UseStakeFormsProps): UnstakeContextValues => {
    const { account, network } = selectedAccount;
    const { symbol } = account;

    const autocompoundBalance = useSelector(selectSelectedAccountAutocompoundBalance);
    const amountLimits: AmountLimitsString = {
        currency: symbol,
        minCrypto: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
        maxCrypto: autocompoundBalance,
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

    const {
        methods,
        clearForm,
        localCurrency,
        currentRate,
        selectedFee,
        changeFeeLevel,
        isComposing,
        composedLevels,
        composeRequest,
        signTx,
        feeInfo,
    } = useCommonEthForm<UnstakeFormState>({
        draftKey: 'unstake-eth',
        defaultValues,
        selectedAccount,
        signTransaction,
    });
    const { register, formState, setValue, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
    }, [register]);

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            if (currentRate) {
                const fiatValue = toFiatCurrency(amount, localCurrency, {
                    [localCurrency]: currentRate?.rate,
                });
                setValue(FIAT_INPUT, fiatValue || '', { shouldValidate: true });
            }

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
                { [localCurrency]: currentRate?.rate },
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
    };
};

export const useUnstakeEthFormContext = () => {
    const ctx = useContext(UnstakeEthFormContext);
    if (ctx === null) throw Error('useUnstakeEthFormContext used without Context');

    return ctx;
};
