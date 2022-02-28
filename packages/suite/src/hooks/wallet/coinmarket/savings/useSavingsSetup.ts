import { useCallback, useEffect } from 'react';
import {
    SavingsSetupFormState,
    SavingsSetupContextValues,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarket/savings/savingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import invityAPI, { PaymentFrequency, SavingsTrade } from '@suite-services/invityAPI';
import { useSelector } from '@suite-hooks';
import BigNumber from 'bignumber.js';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import useSavingsTrade from './useSavingsTrade';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import useSavingsSetupDefaultValues from './useSavingsSetupDefaultValues';
import type { Option } from '@wallet-types/coinmarketCommonTypes';
import { CustomPaymentAmountKey } from '@wallet-constants/coinmarket/savings';

const paymentFrequencyAnnualCoefficient: Record<PaymentFrequency, number> = {
    Weekly: 52,
    Biweekly: 26,
    Monthly: 12,
    Quarterly: 4,
};

const getFiatAmountEffective = (
    fiatAmount: string | undefined,
    customFiatAmount: string | undefined,
) => {
    let fiatAmountEffective = fiatAmount;
    if (fiatAmount === CustomPaymentAmountKey) {
        fiatAmountEffective = customFiatAmount;
        if (!customFiatAmount || Number.isNaN(Number(customFiatAmount))) {
            fiatAmountEffective = '0';
        }
    }
    return fiatAmountEffective;
};

export const useSavingsSetup = ({
    selectedAccount,
}: UseSavingsSetupProps): SavingsSetupContextValues => {
    const { account } = selectedAccount;
    const { fiat, isWatchingKYCStatus, selectedProvider } = useSelector(state => ({
        fiat: state.wallet.fiat,
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));
    const fiatRates = fiat.coins.find(item => item.symbol === 'btc');
    const { navigateToSavingsPaymentInfo } = useCoinmarketNavigation(selectedAccount.account);
    const { savingsTrade, saveSavingsTradeResponse } = useSavingsTrade();
    const { address: unusedAddress } = getUnusedAddressFromAccount(account);
    const defaultValues = useSavingsSetupDefaultValues(
        savingsTrade,
        unusedAddress,
        selectedProvider,
    );

    const paymentFrequencyOptions =
        selectedProvider?.setupPaymentFrequencies.map(
            paymentFrequency =>
                ({
                    label: paymentFrequency,
                    value: paymentFrequency,
                } as Option),
        ) ?? [];

    const paymentAmounts =
        selectedProvider?.setupPaymentAmounts.concat(CustomPaymentAmountKey) ?? [];

    const methods = useForm<SavingsSetupFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, control, formState, setValue } = methods;
    const { isValid, isSubmitting } = formState;
    const { fiatAmount, paymentFrequency, customFiatAmount, address } = useWatch<
        Required<SavingsSetupFormState>
    >({
        control,
        name: ['fiatAmount', 'paymentFrequency', 'customFiatAmount', 'address'],
        defaultValue: defaultValues,
    });

    useEffect(() => {
        if (!isWatchingKYCStatus && !address) {
            setValue('address', unusedAddress);
        }
    }, [isWatchingKYCStatus, address, setValue, unusedAddress]);

    let annualSavingsCalculationFiat = 0;
    let annualSavingsCalculationCrypto = '0';
    if (
        paymentFrequency &&
        savingsTrade?.fiatCurrency &&
        fiatRates?.current &&
        (fiatAmount || customFiatAmount)
    ) {
        const fiatAmountEffective = getFiatAmountEffective(fiatAmount, customFiatAmount);
        annualSavingsCalculationFiat =
            Number(fiatAmountEffective) * paymentFrequencyAnnualCoefficient[paymentFrequency];
        const rate = fiatRates.current.rates[savingsTrade.fiatCurrency.toLowerCase()];
        if (rate) {
            annualSavingsCalculationCrypto = new BigNumber(annualSavingsCalculationFiat)
                .dividedBy(rate)
                .decimalPlaces(8)
                .toString();
        }
    }

    const onSubmit = useCallback(
        async ({
            customFiatAmount,
            fiatAmount,
            paymentFrequency,
            address,
        }: SavingsSetupFormState) => {
            if (savingsTrade && address) {
                const trade: SavingsTrade = {
                    ...savingsTrade,
                    // User can navigate back to setup page and change already active plan. Thus we need to set the status back also.
                    status: 'SetSavingsParameters',
                    paymentFrequency,
                    fiatStringAmount: getFiatAmountEffective(fiatAmount, customFiatAmount),
                    receivingCryptoAddresses: [address],
                };
                const response = await invityAPI.doSavingsTrade({
                    trade,
                });
                if (response) {
                    saveSavingsTradeResponse(response);
                    navigateToSavingsPaymentInfo();
                }
            }
        },
        [navigateToSavingsPaymentInfo, saveSavingsTradeResponse, savingsTrade],
    );

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const canConfirmSetup =
        !!paymentFrequency &&
        !!fiatAmount &&
        (fiatAmount !== CustomPaymentAmountKey || !!customFiatAmount) &&
        !!address &&
        isValid &&
        !isSubmitting;

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
        defaultPaymentFrequency: defaultValues?.paymentFrequency,
        defaultFiatAmount: defaultValues?.fiatAmount,
        annualSavingsCalculationFiat,
        annualSavingsCalculationCrypto,
        fiatAmount,
        fiatCurrency: savingsTrade?.fiatCurrency,
        isWatchingKYCStatus,
        canConfirmSetup,
        account,
        address,
        isSubmitting,
        paymentFrequencyOptions,
        paymentAmounts,
    };
};
