import { type BuyTrade, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import { isArrayMember } from '@trezor/utils';

import { type TradingSendRejectedProps, type TradingTradeType } from '../types';

export const isBuyTrade = (quote: TradingTradeType): quote is BuyTrade =>
    'fiatStringAmount' in quote && 'receiveStringAmount' in quote;

export const isSellFiatTrade = (quote: TradingTradeType): quote is SellFiatTrade =>
    'fiatStringAmount' in quote && !('receiveStringAmount' in quote);

export const isExchangeTrade = (quote: TradingTradeType): quote is ExchangeTrade =>
    'sendStringAmount' in quote && 'receiveStringAmount' in quote;

const TRADING_SEND_REJECTED_TYPES = ['error', 'sign-tx-error', 'sign-transaction-timeout'] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const isSendRejectedError = <TranslationKey extends string = string>(
    error: unknown,
): error is TradingSendRejectedProps<TranslationKey> => {
    if (!isObject(error)) {
        return false;
    }

    const { type, error: errorData } = error;

    if (typeof type !== 'string' || !isArrayMember(type, TRADING_SEND_REJECTED_TYPES)) {
        return false;
    }

    if (!isObject(errorData)) {
        return false;
    }

    if (typeof errorData.id !== 'string') {
        return false;
    }

    if (
        errorData.values !== undefined &&
        (typeof errorData.values !== 'object' || errorData.values === null)
    ) {
        return false;
    }

    return true;
};
