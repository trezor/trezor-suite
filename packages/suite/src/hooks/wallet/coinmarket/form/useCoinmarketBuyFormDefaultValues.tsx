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
import { FiatCurrencyCode } from 'invity-api';
import { formDefaultCurrency } from 'src/constants/wallet/coinmarket/formDefaults';

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
    const suggestedFiatCurrency = (buyInfo?.buyInfo?.suggestedFiatCurrency?.toLowerCase() ??
        formDefaultCurrency) as FiatCurrencyCode;
    const defaultCurrency = useMemo(
        () => buildFiatOption(suggestedFiatCurrency),
        [suggestedFiatCurrency],
    );
    const defaultValues = useMemo(
        () =>
            buyInfo
                ? {
                      fiatInput:
                          buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(
                              suggestedFiatCurrency,
                          ),
                      cryptoInput: undefined,
                      currencySelect: defaultCurrency,
                      cryptoSelect: defaultCrypto,
                      countrySelect: defaultCountry,
                      paymentMethod: defaultPaymentMethod,
                  }
                : undefined,
        [
            buyInfo,
            defaultCountry,
            defaultCrypto,
            defaultCurrency,
            suggestedFiatCurrency,
            defaultPaymentMethod,
        ],
    );

    return {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    };
};
