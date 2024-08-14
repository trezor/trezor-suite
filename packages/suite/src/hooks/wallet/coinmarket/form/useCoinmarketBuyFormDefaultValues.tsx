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
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/coinmarket/form';

export const useCoinmarketBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: BuyInfo | undefined,
    paymentMethods: CoinmarketPaymentMethodListProps[],
): CoinmarketBuyFormDefaultValuesProps => {
    const country = buyInfo?.buyInfo?.country;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    // set defaultCryptoCurrency (BTC), when accountSymbol is not in the list of supported currencies (e.g. VTC)
    const defaultCrypto = useMemo(
        () =>
            buildCryptoOption(networkToCryptoSymbol(accountSymbol) ?? FORM_DEFAULT_CRYPTO_CURRENCY),
        [accountSymbol],
    );
    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () =>
            paymentMethods.find(
                paymentMethod => paymentMethod.value === FORM_DEFAULT_PAYMENT_METHOD,
            ) ?? {
                value: '',
                label: '',
            },
        [paymentMethods],
    );
    const suggestedFiatCurrency = (buyInfo?.buyInfo?.suggestedFiatCurrency?.toLowerCase() ??
        FORM_DEFAULT_FIAT_CURRENCY) as FiatCurrencyCode;
    const defaultCurrency = useMemo(
        () => buildFiatOption(suggestedFiatCurrency),
        [suggestedFiatCurrency],
    );
    const defaultValues = useMemo(
        () => ({
            fiatInput: buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
            cryptoInput: undefined,
            currencySelect: defaultCurrency,
            cryptoSelect: defaultCrypto,
            countrySelect: defaultCountry,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: false,
        }),
        [
            buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
            defaultCountry,
            defaultCrypto,
            defaultCurrency,
            defaultPaymentMethod,
            suggestedFiatCurrency,
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
