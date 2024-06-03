import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContextValues } from 'src/types/coinmarket/coinmarketOffers';

export const getCryptoQuoteAmountProps = (
    quoteInput: BuyTrade | SellFiatTrade | ExchangeTrade | undefined,
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
) => {
    if (!quoteInput) return null;

    if (isCoinmarketBuyOffers(context)) {
        const wantCrypto = context.quotesRequest?.wantCrypto;
        const quote = quoteInput as BuyTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            wantCrypto,
            fiatAmount: quote?.fiatStringAmount ?? '',
            fiatCurrency: quote?.fiatCurrency,
            cryptoAmount: quote?.receiveStringAmount ?? '',
            cryptoCurrency: quote?.receiveCurrency,
        };
    } else if (isCoinmarketSellOffers(context)) {
        const amountInCrypto = context.quotesRequest?.amountInCrypto;
        const quote = quoteInput as SellFiatTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            wantCrypto: amountInCrypto,
            fiatAmount: quote?.fiatStringAmount ?? '',
            fiatCurrency: quote?.fiatCurrency,
            cryptoAmount: quote?.cryptoStringAmount ?? '',
            cryptoCurrency: quote?.cryptoCurrency,
        };
    }

    return null;
};

export const getCryptoHeaderAmountProps = (
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
) => {
    if (isCoinmarketBuyOffers(context)) {
        const quote = getCryptoQuoteAmountProps(context.quotes?.[0], context);

        if (!quote || !context.quotesRequest) return null;

        return quote;
    } else if (isCoinmarketSellOffers(context)) {
        const quote = getCryptoQuoteAmountProps(context.quotes?.[0], context);

        if (!quote || !context.quotesRequest) return null;

        return quote;
    }

    return null;
};

export const getProvidersInfoProps = (
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
) => {
    if (isCoinmarketBuyOffers(context)) {
        return {
            providers: context.providersInfo,
        };
    } else if (isCoinmarketSellOffers(context)) {
        return {
            providers: context.sellInfo?.providerInfos,
        };
    }

    return {
        providers: context.exchangeInfo?.providerInfos,
    };
};
