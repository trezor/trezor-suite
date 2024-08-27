import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';
import {
    isCoinmarketBuyOffers,
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketCryptoListProps,
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketGetFiatCurrenciesProps,
    CoinmarketGetPaymentMethodProps,
    CoinmarketGetProvidersInfoProps,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketOffersContextValues } from 'src/types/coinmarket/coinmarketOffers';

export const getCryptoQuoteAmountProps = (
    quoteInput: CoinmarketTradeDetailType | undefined,
    context: CoinmarketOffersContextValues<CoinmarketTradeType>,
): CoinmarketGetCryptoQuoteAmountProps | null => {
    if (!quoteInput) return null;

    if (isCoinmarketBuyOffers(context)) {
        const amountInCrypto = context.quotesRequest?.wantCrypto;
        const quote = quoteInput as BuyTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            amountInCrypto,
            sendAmount: quote?.fiatStringAmount ?? '',
            sendCurrency: quote?.fiatCurrency,
            receiveAmount: quote?.receiveStringAmount ?? '',
            receiveCurrency: quote?.receiveCurrency,
        };
    }

    if (isCoinmarketSellOffers(context)) {
        const amountInCrypto = context.quotesRequest?.amountInCrypto;
        const quote = quoteInput as SellFiatTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            amountInCrypto,
            sendAmount: quote?.fiatStringAmount ?? '',
            sendCurrency: quote?.fiatCurrency,
            receiveAmount: quote?.cryptoStringAmount ?? '',
            receiveCurrency: quote?.cryptoCurrency,
        };
    }

    const quote = quoteInput as ExchangeTrade;

    return {
        amountInCrypto: false,
        sendAmount: quote?.sendStringAmount ?? '',
        sendCurrency: quote?.send,
        receiveAmount: quote?.receiveStringAmount ?? '',
        receiveCurrency: quote?.receive,
    };
};

export const getProvidersInfoProps = (
    context:
        | CoinmarketOffersContextValues<CoinmarketTradeType>
        | CoinmarketFormContextValues<CoinmarketTradeType>,
): CoinmarketGetProvidersInfoProps => {
    if (isCoinmarketBuyOffers(context)) {
        return context.buyInfo?.providerInfos;
    }

    if (isCoinmarketSellOffers(context)) {
        return context.sellInfo?.providerInfos;
    }

    return context.exchangeInfo?.providerInfos;
};

export const getFiatCurrenciesProps = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
): CoinmarketGetFiatCurrenciesProps | null => {
    if (isCoinmarketBuyOffers(context)) {
        return {
            supportedFiatCurrencies: context.buyInfo?.supportedFiatCurrencies,
            defaultAmountsOfFiatCurrencies: context.buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
        };
    }

    if (isCoinmarketSellOffers(context)) {
        return {
            supportedFiatCurrencies: context.sellInfo?.supportedFiatCurrencies,
        };
    }

    return null;
};

export const getSelectQuoteTyped = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
): ((quote: CoinmarketTradeDetailMapProps[typeof context.type]) => void) => {
    const selectQuote = context.selectQuote as (
        quote: CoinmarketTradeDetailMapProps[typeof context.type],
    ) => void;

    return selectQuote;
};

export const isBuyTrade = (quote: CoinmarketTradeDetailType): quote is BuyTrade => {
    return 'fiatStringAmount' in quote && 'receiveStringAmount' in quote;
};

export const isSellTrade = (quote: CoinmarketTradeDetailType): quote is SellFiatTrade => {
    return 'fiatStringAmount' in quote && 'cryptoStringAmount' in quote;
};

export const isExchangeTrade = (quote: CoinmarketTradeDetailType): quote is ExchangeTrade => {
    return 'sendStringAmount' in quote && 'receiveStringAmount' in quote;
};

export const getSelectedCrypto = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
): CoinmarketCryptoListProps | null | undefined => {
    if (isCoinmarketExchangeOffers(context)) {
        return context.getValues().receiveCryptoSelect;
    }

    if (isCoinmarketSellOffers(context)) {
        return context.getValues().sendCryptoSelect;
    }

    return context.getValues().cryptoSelect;
};

export const getPaymentMethod = (
    selectedQuote: SellFiatTrade | ExchangeTrade | BuyTrade,
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
): CoinmarketGetPaymentMethodProps => {
    if (isCoinmarketExchangeOffers(context)) return {};

    const selectedQuoteTyped = selectedQuote as SellFiatTrade | BuyTrade;

    return {
        paymentMethod: selectedQuoteTyped.paymentMethod,
        paymentMethodName: selectedQuoteTyped.paymentMethodName,
    };
};
