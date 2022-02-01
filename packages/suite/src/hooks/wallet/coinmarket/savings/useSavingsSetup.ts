import { createContext, useCallback, useEffect } from 'react';
import {
    SavingsSetupFormState,
    SavingsSetupContextValues,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarket/savings/savingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import { PaymentFrequency } from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import BigNumber from 'bignumber.js';

export const SavingsUserInfoContext = createContext<SavingsSetupContextValues | null>(null);
SavingsUserInfoContext.displayName = 'SavingsUserInfoContext';

const paymentFrequencyAnnualCoefficient: Record<PaymentFrequency, number> = {
    Weekly: 52,
    Biweekly: 26,
    Monthly: 12,
    Quarterly: 4,
};

// TODO:
// eslint-disable-next-line no-empty-pattern
export const useSavingsSetup = ({}: UseSavingsSetupProps): SavingsSetupContextValues => {
    const { invityAuthentication, fiat, savingsTrade, isWatchingKYCStatus, savingsInfo } =
        useSelector(state => ({
            invityAuthentication: state.wallet.coinmarket.invityAuthentication,
            fiat: state.wallet.fiat,
            savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
            savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
            isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        }));
    const fiatRates = fiat.coins.find(item => item.symbol === 'btc');
    // const { } = useInvityNavigation(
    //     selectedAccount.account,
    // );

    const { loadInvityData, loadSavingsTrade } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const provider = savingsInfo?.savingsList?.providers[0];
    useEffect(() => {
        if (provider && invityAuthentication) {
            loadSavingsTrade(provider.name);
        }
    }, [loadSavingsTrade, provider, invityAuthentication]);

    // TODO: defaultValues hardcoded?
    const defaultPaymentFrequency = 'Weekly';
    const defaultFiatAmount = '50';
    const methods = useForm<SavingsSetupFormState>({
        mode: 'onChange',
        defaultValues: {
            fiatAmount: defaultFiatAmount,
            paymentFrequency: defaultPaymentFrequency,
            customFiatAmount: defaultFiatAmount,
        },
    });

    const { control, formState } = methods;

    const { fiatAmount, paymentFrequency, customFiatAmount } = useWatch<
        Required<SavingsSetupFormState>
    >({
        control,
        name: ['fiatAmount', 'paymentFrequency', 'customFiatAmount'],
        defaultValue: {
            fiatAmount: defaultFiatAmount,
            paymentFrequency: defaultPaymentFrequency,
            customFiatAmount: defaultFiatAmount,
        },
    });

    let annualSavingsCalculationFiat = 0;
    let annualSavingsCalculationCrypto = '0';
    if (
        paymentFrequency &&
        savingsTrade?.fiatCurrency &&
        fiatRates?.current &&
        (fiatAmount || customFiatAmount)
    ) {
        let fiatAmountEffective = fiatAmount;
        if (fiatAmount === 'Custom') {
            fiatAmountEffective = customFiatAmount;
            if (!customFiatAmount || Number.isNaN(Number(customFiatAmount))) {
                fiatAmountEffective = '0';
            }
        }

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

    const { register } = methods;

    const onSubmit = async () => {
        // TODO
    };

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const canConfirmSetup =
        formState.isValid && !isWatchingKYCStatus && savingsTrade?.kycStatus === 'Verified';

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
        defaultPaymentFrequency,
        defaultFiatAmount,
        annualSavingsCalculationFiat,
        annualSavingsCalculationCrypto,
        fiatAmount,
        isWatchingKYCStatus,
        canConfirmSetup,
    };
};
