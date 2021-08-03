import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { useMemo } from 'react';
import regional from '@wallet-constants/coinmarket/regional';
import { Account } from '@wallet-types';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';

export const useCoinmarketBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo?: BuyInfo,
) => {
    const country = buyInfo?.buyInfo?.country || regional.unknownCountry;
    const defaultCountry = useMemo(
        () => ({
            label: regional.countriesMap.get(country),
            value: country,
        }),
        [country],
    );
    const defaultCurrencyInfo = buyInfo?.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = useMemo(
        () =>
            defaultCurrencyInfo ? buildOption(defaultCurrencyInfo) : { label: 'USD', value: 'usd' },
        [defaultCurrencyInfo],
    );
    const defaultCrypto = useMemo(
        () => ({
            value: accountSymbol.toUpperCase(),
            label: accountSymbol.toUpperCase(),
        }),
        [accountSymbol],
    );
    const defaultValues = useMemo(
        () =>
            buyInfo
                ? {
                      fiatInput: '',
                      cryptoInput: '',
                      currencySelect: defaultCurrency,
                      cryptoSelect: defaultCrypto,
                      countrySelect: defaultCountry,
                  }
                : undefined,
        [buyInfo, defaultCountry, defaultCrypto, defaultCurrency],
    );
    return { defaultValues, defaultCountry, defaultCurrency };
};
