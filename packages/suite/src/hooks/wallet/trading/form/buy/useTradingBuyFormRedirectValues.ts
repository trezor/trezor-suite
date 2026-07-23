import { type BuyTradeQuoteRequest } from 'invity-api';

import {
    type TradingBuyFormProps,
    type TradingCountryCode,
    buildTradingFiatOption,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getSupportedFiatCurrencyWithFallback,
    useTradingAssets,
} from '@suite-common/trading';

export const useTradingBuyFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: BuyTradeQuoteRequest | undefined,
): TradingBuyFormProps | null => {
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    if (!isFromRedirect || !quotesRequest) return null;

    return {
        amountInCrypto: quotesRequest.wantCrypto,
        cryptoSelect: createAssetOptionFromCryptoId(quotesRequest.receiveCurrency),
        currencySelect: buildTradingFiatOption(
            getSupportedFiatCurrencyWithFallback(quotesRequest.fiatCurrency),
        ),
        countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
        countrySubdivisionSelect: getDefaultCountrySubdivision(quotesRequest.subdivision),

        // fill the input that corresponds to the entered amount type
        ...(quotesRequest.wantCrypto
            ? { cryptoInput: quotesRequest.cryptoStringAmount }
            : { fiatInput: quotesRequest.fiatStringAmount }),

        paymentMethod: quotesRequest.paymentMethod && {
            value: quotesRequest.paymentMethod,
            label: quotesRequest.paymentMethod,
        },
    };
};
