import { createContext, useCallback, useEffect, useState } from 'react';
import {
    SavingsSetupFormState,
    SavingsSetupContextValues,
    UseSavingsSetupProps,
} from '@wallet-types/coinmarket/savings/savingsSetup';
import { useForm, useWatch } from 'react-hook-form';
import invityAPI, { PaymentFrequency } from '@suite-services/invityAPI';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import BigNumber from 'bignumber.js';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import useSavingsTrade from './useSavingsTrade';

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
    const { fiat, isWatchingKYCStatus } = useSelector(state => ({
        fiat: state.wallet.fiat,
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
    }));
    const fiatRates = fiat.coins.find(item => item.symbol === 'btc');
    // const { } = useInvityNavigation(
    //     selectedAccount.account,
    // );

    const { verifyAddress } = useActions({
        verifyAddress: coinmarketSavingsActions.verifyAddress,
    });

    const savingsTrade = useSavingsTrade();

    // TODO: defaultValues hardcoded?
    const defaultPaymentFrequency = 'Weekly';
    const defaultFiatAmount = '50';
    const { address: unusedAddress } = getUnusedAddressFromAccount(account);
    // TODO: define 'fiat amount options' and set fiatAmount = 'Custom' if not from 'fiat amount options'
    const defaultValues: SavingsSetupFormState = {
        fiatAmount: savingsTrade?.fiatStringAmount || defaultFiatAmount,
        paymentFrequency: savingsTrade?.paymentFrequency || defaultPaymentFrequency,
        customFiatAmount: savingsTrade?.fiatStringAmount || defaultFiatAmount,
        address: isWatchingKYCStatus
            ? undefined
            : savingsTrade?.receivingCryptoAddress || unusedAddress,
    };

    const methods = useForm<SavingsSetupFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, control, formState, handleSubmit, setValue } = methods;
    const { isValid } = formState;
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
                await invityAPI.doSavingsTrade({
                    trade,
                });
                setWasSetupSaved(true);
            }
        },
        [savingsTrade],
    );

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const canConfirmSetup =
        formState.isValid && !isWatchingKYCStatus && savingsTrade?.kycStatus === 'Verified';

    useEffect(() => {
        if (isWatchingKYCStatus) {
            setWasSetupSaved(false);
            if (isValid) {
                handleSubmit(onSubmit)();
            }
        }
    }, [
        fiatAmount,
        paymentFrequency,
        customFiatAmount,
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
