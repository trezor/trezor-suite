import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    SavingsSetupFormState,
    SavingsSetupContextValues,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarket/savings/savingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import invityAPI, { PaymentFrequency } from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import BigNumber from 'bignumber.js';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';

export const SavingsUserInfoContext = createContext<SavingsSetupContextValues | null>(null);
SavingsUserInfoContext.displayName = 'SavingsUserInfoContext';

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
    if (fiatAmount === 'Custom') {
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

    const { loadInvityData, loadSavingsTrade, verifyAddress } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
        verifyAddress: coinmarketSavingsActions.verifyAddress,
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
    const { address: unusedAddress } = getUnusedAddressFromAccount(account);
    const defaultValues: SavingsSetupFormState = useMemo(
        () => ({
            fiatAmount: defaultFiatAmount,
            paymentFrequency: defaultPaymentFrequency,
            customFiatAmount: defaultFiatAmount,
            address: unusedAddress,
        }),
        [unusedAddress],
    );
    const methods = useForm<SavingsSetupFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, control, formState, handleSubmit, reset } = methods;
    const { isDirty, isValid } = formState;
    const { fiatAmount, paymentFrequency, customFiatAmount, address } = useWatch<
        Required<SavingsSetupFormState>
    >({
        control,
        name: ['fiatAmount', 'paymentFrequency', 'customFiatAmount', 'address'],
        defaultValue: defaultValues,
    });

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

    const [wasSetupSaved, setWasSetupSaved] = useState(false);

    const onSubmit = useCallback(
        async ({
            customFiatAmount,
            fiatAmount,
            paymentFrequency,
            address,
        }: SavingsSetupFormState) => {
            if (savingsTrade) {
                const trade = {
                    ...savingsTrade,
                    paymentFrequency,
                    fiatStringAmount: getFiatAmountEffective(fiatAmount, customFiatAmount),
                    receivingCryptoAddress: address,
                };
                const response = await invityAPI.doSavingsTrade({
                    trade,
                });
                console.log(response);
                reset({
                    paymentFrequency,
                    fiatAmount,
                    customFiatAmount,
                    address,
                });
                setWasSetupSaved(true);
            }
        },
        [reset, savingsTrade],
    );

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const canConfirmSetup =
        formState.isValid && !isWatchingKYCStatus && savingsTrade?.kycStatus === 'Verified';

    const timeoutId = useRef<number | undefined>();
    useEffect(() => {
        if (isWatchingKYCStatus) {
            setWasSetupSaved(false);
            window.clearTimeout(timeoutId.current);
            timeoutId.current = window.setTimeout(() => {
                if (isDirty && isValid) {
                    handleSubmit(onSubmit)();
                }
            }, 1000);
        }
    }, [
        fiatAmount,
        paymentFrequency,
        customFiatAmount,
        address,
        isDirty,
        onSubmit,
        isWatchingKYCStatus,
        isValid,
        handleSubmit,
    ]);

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
        account,
        address,
        wasSetupSaved,
        verifyAddress,
    };
};
