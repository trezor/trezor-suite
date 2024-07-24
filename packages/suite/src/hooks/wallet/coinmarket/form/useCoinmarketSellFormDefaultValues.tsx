import { useMemo } from 'react';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    buildCryptoOption,
    buildFiatOption,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { defaultCryptoCurrency } from 'src/constants/wallet/coinmarket/cryptoCurrencies';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';
import { formDefaultCurrency } from 'src/constants/wallet/coinmarket/formDefaults';
import { CoinmarketSellFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';

export const useCoinmarketSellFormDefaultValues = (
    accountSymbol: Account['symbol'],
    sellInfo: SellInfo | undefined,
    paymentMethods: CoinmarketPaymentMethodListProps[],
    defaultAddress?: string,
): CoinmarketSellFormDefaultValuesProps => {
    const country = sellInfo?.sellList?.country;
    const defaultCrypto = useMemo(
        () => buildCryptoOption(networkToCryptoSymbol(accountSymbol) ?? defaultCryptoCurrency),
        [accountSymbol],
    );
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () =>
            paymentMethods.find(paymentMethod => paymentMethod.value === 'creditCard') ?? {
                value: '',
                label: '',
            },
        [paymentMethods],
    );
    const defaultCurrency = useMemo(() => buildFiatOption(formDefaultCurrency), []);
    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            address: defaultAddress ?? '',
        }),
        [defaultAddress],
    );
    const defaultFormState: FormState = useMemo(
        () => ({
            ...DEFAULT_VALUES,
            selectedUtxos: [],
            options: ['broadcast'],
            outputs: [defaultPayment],
        }),
        [defaultPayment],
    );
    const defaultValues = useMemo(
        () => ({
            ...defaultFormState,
            fiatInput: '',
            cryptoInput: '',
            currencySelect: defaultCurrency,
            cryptoSelect: defaultCrypto,
            countrySelect: defaultCountry,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: true,
        }),
        [defaultCurrency, defaultCrypto, defaultCountry, defaultPaymentMethod, defaultFormState],
    );

    return { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod };
};
