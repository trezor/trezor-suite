import { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import { useMemo } from 'react';
import { Account } from 'src/types/wallet';
import {
    buildCryptoOption,
    buildFiatOption,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const useCoinmarketBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo?: BuyInfo,
) => {
    const country = buyInfo?.buyInfo?.country;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCrypto = useMemo(() => buildCryptoOption(accountSymbol), [accountSymbol]);
    const defaultPaymentMethod = useMemo(() => ({ value: '', label: '' }), []);
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
                      fiatInput: '3000',
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
