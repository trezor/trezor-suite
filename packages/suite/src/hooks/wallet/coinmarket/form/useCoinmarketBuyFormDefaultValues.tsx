import { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import { useMemo } from 'react';
import { Account } from 'src/types/wallet';
import {
    buildCryptoOption,
    buildFiatOption,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketBuyFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';
import defaultFiatCurrencies from 'src/constants/wallet/coinmarket/fiatCurrencies';

export const useCoinmarketBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: BuyInfo | undefined,
    paymentMethods: CoinmarketPaymentMethodListProps[],
): CoinmarketBuyFormDefaultValuesProps => {
    const country = buyInfo?.buyInfo?.country;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCrypto = useMemo(() => buildCryptoOption(accountSymbol), [accountSymbol]);
    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () =>
            paymentMethods.find(paymentMethod => paymentMethod.value === 'creditCard') ?? {
                value: '',
                label: '',
            },
        [paymentMethods],
    );
    const defaultCurrencyInfo = buyInfo?.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = useMemo(
        () =>
            defaultCurrencyInfo
                ? buildFiatOption(defaultCurrencyInfo)
                : { label: 'USD', value: 'usd' },
        [defaultCurrencyInfo],
    );
    const defaultValues = useMemo(
        () =>
            buyInfo
                ? {
                      fiatInput: defaultFiatCurrencies.get('czk'),
                      cryptoInput: undefined,
                      currencySelect: defaultCurrency,
                      cryptoSelect: defaultCrypto,
                      countrySelect: defaultCountry,
                      paymentMethod: defaultPaymentMethod,
                  }
                : undefined,
        [buyInfo, defaultCountry, defaultCrypto, defaultCurrency, defaultPaymentMethod],
    );

    return { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod };
};
