import { type BuyTrade, type CryptoId, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    type TradingBuyType,
    type TradingExchangeType,
    type TradingFiatCurrencyOption,
    type TradingSellType,
    type TradingTradeMapProps,
    type TradingTradeType,
    type TradingType,
} from '@suite-common/trading';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';

import {
    type TradingGetCryptoQuoteAmountProps,
    type TradingGetFiatCurrenciesProps,
    type TradingGetPaymentMethodProps,
    type TradingGetProvidersInfoProps,
} from 'src/types/trading/trading';
import {
    type TradingFormContextValues,
    type TradingFormMapProps,
} from 'src/types/trading/tradingForm';

export const isTradingBuyContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingBuyType] => context.type === 'buy';

export const isTradingSellContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingSellType] => context.type === 'sell';

export const isTradingExchangeContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingExchangeType] => context.type === 'exchange';

export const getCryptoQuoteAmountProps = (
    quoteInput: TradingTradeType | undefined,
    context: TradingFormContextValues<TradingType>,
): TradingGetCryptoQuoteAmountProps | null => {
    if (!quoteInput) return null;

    if (isTradingBuyContext(context)) {
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

    if (isTradingSellContext(context)) {
        const amountInCrypto = context.quotesRequest?.amountInCrypto;
        const networkFee = context.composedTransactionInfo?.composed?.fee;
        const quote = quoteInput as SellFiatTrade;

        if (!quote || !context.quotesRequest) return null;

        return {
            amountInCrypto,
            sendAmount: quote?.fiatStringAmount ?? '',
            sendCurrency: quote?.fiatCurrency,
            receiveAmount: quote?.cryptoStringAmount ?? '',
            receiveCurrency: quote?.cryptoCurrency,
            networkFee,
        };
    }

    const quote = quoteInput as ExchangeTrade;
    const networkFee = context.composedTransactionInfo?.composed?.fee;

    return {
        amountInCrypto: false,
        sendAmount: quote?.sendStringAmount ?? '',
        sendCurrency: quote?.send,
        receiveAmount: quote?.receiveStringAmount ?? '',
        receiveCurrency: quote?.receive,
        networkFee,
    };
};

export const getProvidersInfoProps = (
    context: TradingFormContextValues<TradingType>,
): TradingGetProvidersInfoProps => {
    if (isTradingBuyContext(context)) {
        return context.buyInfo?.providerInfos;
    }

    if (isTradingSellContext(context)) {
        return context.sellInfo?.providerInfos;
    }

    return context.exchangeInfo?.providerInfos;
};

export const getFiatCurrenciesProps = (
    context: TradingFormContextValues<TradingType>,
): TradingGetFiatCurrenciesProps | null => {
    if (isTradingBuyContext(context)) {
        return {
            supportedFiatCurrencies: context.buyInfo?.supportedFiatCurrencies,
            defaultAmountsOfFiatCurrencies: context.buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
        };
    }

    if (isTradingSellContext(context)) {
        return {
            supportedFiatCurrencies: context.sellInfo?.supportedFiatCurrencies,
        };
    }

    return null;
};

export const getSelectQuoteTyped = (
    context: TradingFormContextValues<TradingType>,
): ((quote: TradingTradeMapProps[typeof context.type]) => void) => {
    const selectQuote = context.selectQuote as (
        quote: TradingTradeMapProps[typeof context.type],
    ) => void;

    return selectQuote;
};

export const getSelectedCryptoId = (
    context: TradingFormContextValues<TradingType>,
): CryptoId | null => {
    if (isTradingExchangeContext(context)) {
        return context.getValues().receiveCryptoSelect?.id ?? null;
    }

    if (isTradingSellContext(context)) {
        return context.getValues().sendCryptoSelect?.id ?? null;
    }

    return context.getValues().cryptoSelect.id ?? null;
};

export const getSelectedTradingCurrency = (
    context: TradingFormContextValues<TradingType>,
): TradingFiatCurrencyOption | BaseCurrencyOption => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(TRADING_FORM_OUTPUT_CURRENCY);
    }

    if (isTradingSellContext(context)) {
        return context.getValues(TRADING_FORM_OUTPUT_CURRENCY);
    }

    return context.getValues(TRADING_FORM_FIAT_CURRENCY_SELECT);
};

export const getPaymentMethod = (
    selectedQuote: SellFiatTrade | ExchangeTrade | BuyTrade,
    context: TradingFormContextValues<TradingType>,
): TradingGetPaymentMethodProps => {
    if (isTradingExchangeContext(context)) return {};

    const selectedQuoteTyped = selectedQuote as SellFiatTrade | BuyTrade;

    return {
        paymentMethod: selectedQuoteTyped.paymentMethod,
        paymentMethodName: selectedQuoteTyped.paymentMethodName,
    };
};
