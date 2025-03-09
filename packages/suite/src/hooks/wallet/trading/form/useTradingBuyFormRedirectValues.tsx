import { BuyTradeQuoteRequest } from 'invity-api';

import { TradingBuyFormProps, getDefaultCountry, useTradingInfo } from '@suite-common/trading';

import { buildFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormRedirectValues = (
    isFromRedirect: boolean,
    quotesRequest: BuyTradeQuoteRequest | undefined,
): TradingBuyFormProps | null => {
    const { buildDefaultCryptoOption } = useTradingInfo();

    return isFromRedirect && quotesRequest
        ? {
              amountInCrypto: quotesRequest.wantCrypto,
              cryptoSelect: buildDefaultCryptoOption(quotesRequest.receiveCurrency),
              currencySelect: buildFiatOption(quotesRequest.fiatCurrency),
              countrySelect: getDefaultCountry(quotesRequest.country),
              cryptoInput: quotesRequest.cryptoStringAmount,
              paymentMethod: quotesRequest.paymentMethod && {
                  value: quotesRequest.paymentMethod,
                  label: quotesRequest.paymentMethod,
              },
          }
        : null;
};
