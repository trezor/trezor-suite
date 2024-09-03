import { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import { useMemo } from 'react';
import { Account } from 'src/types/wallet';
import { buildFiatOption, getDefaultCountry } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketBuyFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';
import {
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/coinmarket/form';
import { FiatCurrencyCode, CryptoId } from 'invity-api';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { getCoingeckoId } from '@suite-common/wallet-config';

export const useCoinmarketBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: BuyInfo | undefined,
): CoinmarketBuyFormDefaultValuesProps => {
    const { buildDefaultCryptoOption } = useCoinmarketInfo();
    const cryptoId = getCoingeckoId(accountSymbol) as CryptoId;

    const country = buyInfo?.buyInfo?.country;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCrypto = useMemo(
        () => buildDefaultCryptoOption(cryptoId),
        [buildDefaultCryptoOption, cryptoId],
    );
    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () => ({
            value: FORM_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
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
