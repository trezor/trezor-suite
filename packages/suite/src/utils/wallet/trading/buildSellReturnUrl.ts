import { type SellFiatTrade, type SellFiatTradeQuoteRequest } from 'invity-api';

import {
    type TradingComposedTransactionInfo,
    type TradingSellInfoSelector,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

type BuildSellReturnUrlParams = {
    quote: SellFiatTrade;
    sellInfo: TradingSellInfoSelector | undefined;
    quotesRequest: SellFiatTradeQuoteRequest | undefined;
    account: Account | undefined;
    composedInfo: TradingComposedTransactionInfo;
};

export const buildSellReturnUrl = async ({
    quote,
    sellInfo,
    quotesRequest,
    account,
    composedInfo,
}: BuildSellReturnUrlParams): Promise<string | undefined> => {
    const provider =
        sellInfo?.providerInfos && quote.exchange
            ? sellInfo.providerInfos[quote.exchange]
            : undefined;

    if (!quotesRequest || !provider || !account) {
        return undefined;
    }

    const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;

    return await createQuoteLink(
        {
            ...quotesRequest,
            country: quotesRequest.country ?? quote.country,
            fiatCurrency: quotesRequest.fiatCurrency ?? quote.fiatCurrency,
            amountInCrypto: quotesRequest.amountInCrypto ?? quote.amountInCrypto,
            cryptoStringAmount: quotesRequest.cryptoStringAmount ?? quote.cryptoStringAmount,
            fiatStringAmount: quotesRequest.fiatStringAmount ?? quote.fiatStringAmount,
            cryptoCurrency: quotesRequest.cryptoCurrency ?? quote.cryptoCurrency,
            paymentMethod: quote.paymentMethod,
        },
        account,
        composedInfo,
        orderId,
    );
};
