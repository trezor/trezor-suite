import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { CurrencyOption } from '@suite-common/wallet-types';
import type {
    TradingBuyType,
    TradingExchangeType,
    TradingSellType,
    TradingTradeType,
    TradingType,
} from '@suite-common/invity';

import {
    FORM_FIAT_CURRENCY_SELECT,
    FORM_OUTPUT_CURRENCY,
} from 'src/constants/wallet/coinmarket/form';
import {
    CoinmarketCryptoListProps,
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketGetFiatCurrenciesProps,
    CoinmarketGetPaymentMethodProps,
    CoinmarketGetProvidersInfoProps,
    CoinmarketTradeDetailMapProps,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketFormContextValues,
    CoinmarketFormMapProps,
} from 'src/types/coinmarket/coinmarketForm';

export const isCoinmarketBuyContext = (
    context: CoinmarketFormMapProps[keyof CoinmarketFormMapProps],
): context is CoinmarketFormMapProps[TradingBuyType] => context.type === 'buy';

export const isCoinmarketSellContext = (
    context: CoinmarketFormMapProps[keyof CoinmarketFormMapProps],
): context is CoinmarketFormMapProps[TradingSellType] => context.type === 'sell';

export const isCoinmarketExchangeContext = (
    context: CoinmarketFormMapProps[keyof CoinmarketFormMapProps],
): context is CoinmarketFormMapProps[TradingExchangeType] => context.type === 'exchange';

export const getCryptoQuoteAmountProps = (
    quoteInput: TradingTradeType | undefined,
    context: CoinmarketFormContextValues<TradingType>,
): CoinmarketGetCryptoQuoteAmountProps | null => {
    if (!quoteInput) return null;

    if (isCoinmarketBuyContext(context)) {
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

    if (isCoinmarketSellContext(context)) {
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
    context: CoinmarketFormContextValues<TradingType>,
): CoinmarketGetProvidersInfoProps => {
    if (isCoinmarketBuyContext(context)) {
        return context.buyInfo?.providerInfos;
    }

    if (isCoinmarketSellContext(context)) {
        return context.sellInfo?.providerInfos;
    }

    return context.exchangeInfo?.providerInfos;
};

export const getFiatCurrenciesProps = (
    context: CoinmarketFormContextValues<TradingType>,
): CoinmarketGetFiatCurrenciesProps | null => {
    if (isCoinmarketBuyContext(context)) {
        return {
            supportedFiatCurrencies: context.buyInfo?.supportedFiatCurrencies,
            defaultAmountsOfFiatCurrencies: context.buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
        };
    }

    if (isCoinmarketSellContext(context)) {
        return {
            supportedFiatCurrencies: context.sellInfo?.supportedFiatCurrencies,
        };
    }

    return null;
};

export const getSelectQuoteTyped = (
    context: CoinmarketFormContextValues<TradingType>,
): ((quote: CoinmarketTradeDetailMapProps[typeof context.type]) => void) => {
    const selectQuote = context.selectQuote as (
        quote: CoinmarketTradeDetailMapProps[typeof context.type],
    ) => void;

    return selectQuote;
};

export const getSelectedCrypto = (
    context: CoinmarketFormContextValues<TradingType>,
): CoinmarketCryptoListProps | null | undefined => {
    if (isCoinmarketExchangeContext(context)) {
        return context.getValues().receiveCryptoSelect;
    }

    if (isCoinmarketSellContext(context)) {
        return context.getValues().sendCryptoSelect;
    }

    return context.getValues().cryptoSelect;
};

export const getSelectedCurrency = (
    context: CoinmarketFormContextValues<TradingType>,
): CurrencyOption => {
    if (isCoinmarketExchangeContext(context)) {
        return context.getValues(FORM_OUTPUT_CURRENCY);
    }

    if (isCoinmarketSellContext(context)) {
        return context.getValues(FORM_OUTPUT_CURRENCY);
    }

    return context.getValues(FORM_FIAT_CURRENCY_SELECT);
};

export const getPaymentMethod = (
    selectedQuote: SellFiatTrade | ExchangeTrade | BuyTrade,
    context: CoinmarketFormContextValues<TradingType>,
): CoinmarketGetPaymentMethodProps => {
    if (isCoinmarketExchangeContext(context)) return {};

    const selectedQuoteTyped = selectedQuote as SellFiatTrade | BuyTrade;

    return {
        paymentMethod: selectedQuoteTyped.paymentMethod,
        paymentMethodName: selectedQuoteTyped.paymentMethodName,
    };
};
