import { BuyTradeQuoteRequest, FiatCurrencyCode } from 'invity-api';

import {
    TradingBuyFormProps,
    TradingCountryCode,
    getDefaultCountry,
    useTradingInfo,
} from '@suite-common/trading';

import { buildTradingFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: BuyTradeQuoteRequest | undefined,
): TradingBuyFormProps | null => {
    const { buildDefaultCryptoOption } = useTradingInfo();

    return isFromRedirect && quotesRequest
        ? {
              amountInCrypto: quotesRequest.wantCrypto,
              cryptoSelect: buildDefaultCryptoOption(quotesRequest.receiveCurrency),
              currencySelect: buildTradingFiatOption(
                  quotesRequest.fiatCurrency as FiatCurrencyCode,
              ),
              countrySelect: getDefaultCountry(quotesRequest.country as TradingCountryCode),
              cryptoInput: quotesRequest.cryptoStringAmount,
              paymentMethod: quotesRequest.paymentMethod && {
                  value: quotesRequest.paymentMethod,
                  label: quotesRequest.paymentMethod,
              },
          }
        : null;
};
