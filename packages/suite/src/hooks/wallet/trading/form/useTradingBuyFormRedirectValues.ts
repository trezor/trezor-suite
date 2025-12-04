import { BuyTradeQuoteRequest, FiatCurrencyCode } from 'invity-api';

import {
    TradingBuyFormProps,
    TradingCountryCode,
    getDefaultCountry,
    useTradingAssets,
} from '@suite-common/trading';

import { buildTradingFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: BuyTradeQuoteRequest | undefined,
): TradingBuyFormProps | null => {
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    if (!isFromRedirect || !quotesRequest) return null;

    return {
        amountInCrypto: quotesRequest.wantCrypto,
        cryptoSelect: createAssetOptionFromCryptoId(quotesRequest.receiveCurrency),
        currencySelect: buildTradingFiatOption(quotesRequest.fiatCurrency as FiatCurrencyCode),
        countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),

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
