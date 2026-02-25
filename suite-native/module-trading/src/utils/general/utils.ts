import type { BuyTradeStatus, CryptoId, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import {
    TradingTradeType,
    TradingTransaction,
    TradingType,
    isBuyTrade,
    isExchangeTrade,
    isSellFiatTrade,
    tradeFinalStatuses,
} from '@suite-common/trading';
import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import type { Translate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';
import { getWeakRandomId } from '@trezor/utils';

type UndefinedTradeOperation = {
    fromValue: undefined;
    fromCurrency: undefined;
    toValue: undefined;
    toCurrency: undefined;
    isFromCrypto: undefined;
    isToCrypto: undefined;
};

type FiatToCryptoOperation = {
    fromValue: string | undefined;
    fromCurrency: string | undefined;
    toValue: string | undefined;
    toCurrency: CryptoId | undefined;
    isFromCrypto: false;
    isToCrypto: true;
};

type CryptoToFiatOperation = {
    fromValue: string | undefined;
    fromCurrency: CryptoId | undefined;
    toValue: string | undefined;
    toCurrency: string | undefined;
    isFromCrypto: true;
    isToCrypto: false;
};

type CryptoToCryptoOperation = {
    fromValue: string | undefined;
    fromCurrency: CryptoId | undefined;
    toValue: string | undefined;
    toCurrency: CryptoId | undefined;
    isFromCrypto: true;
    isToCrypto: true;
};

export type TradeOperationData =
    | UndefinedTradeOperation
    | FiatToCryptoOperation
    | CryptoToFiatOperation
    | CryptoToCryptoOperation;

export const getTradeOperationData = (trade: TradingTradeType | undefined): TradeOperationData => {
    if (!trade) {
        return {
            fromValue: undefined,
            fromCurrency: undefined,
            toValue: undefined,
            toCurrency: undefined,
            isFromCrypto: undefined,
            isToCrypto: undefined,
        };
    }

    if (isBuyTrade(trade)) {
        return {
            fromValue: trade.fiatStringAmount,
            fromCurrency: trade.fiatCurrency,
            toValue: trade.receiveStringAmount,
            toCurrency: trade.receiveCurrency,
            isFromCrypto: false,
            isToCrypto: true,
        };
    }

    if (isSellFiatTrade(trade)) {
        return {
            fromValue: trade.cryptoStringAmount,
            fromCurrency: trade.cryptoCurrency,
            toValue: trade.fiatStringAmount,
            toCurrency: trade.fiatCurrency,
            isFromCrypto: true,
            isToCrypto: false,
        };
    }

    if (isExchangeTrade(trade)) {
        return {
            fromValue: trade.sendStringAmount,
            fromCurrency: trade.send,
            toValue: trade.receiveStringAmount,
            toCurrency: trade.receive,
            isFromCrypto: true,
            isToCrypto: true,
        };
    }

    return exhaustive(trade);
};

export const getBuyTradeStatusStep = (tradeStatus: BuyTradeStatus | undefined) => {
    if (!tradeStatus) {
        return undefined;
    }
    switch (tradeStatus) {
        case 'SUBMITTED':
        case 'WAITING_FOR_USER':
            return 'waiting';
        case 'APPROVAL_PENDING':
            return 'processing';
        case 'SUCCESS':
            return 'success';
        case 'ERROR':
        case 'BLOCKED':
            return 'error';
        default:
            return undefined;
    }
};

const getExchangeTradeStatusStep = (tradeStatus: ExchangeTradeStatus | undefined) => {
    if (!tradeStatus) {
        return undefined;
    }
    switch (tradeStatus) {
        case 'CONVERTING':
            return 'converting';
        case 'KYC':
            return 'kyc';
        case 'ERROR':
            return 'error';
        case 'SUCCESS':
            return 'success';

        default: {
            if (!tradeFinalStatuses['exchange'].includes(tradeStatus)) {
                return 'sending';
            }

            return undefined;
        }
    }
};

const getSellTradeStatusStep = (tradeStatus: SellTradeStatus | undefined) => {
    if (!tradeStatus) {
        return undefined;
    }
    switch (tradeStatus) {
        case 'SUCCESS':
            return 'success';
        default: {
            return tradeFinalStatuses['sell'].includes(tradeStatus) ? 'error' : 'pending';
        }
    }
};

export const getTradeStatusStep = (trade: TradingTransaction | undefined) => {
    if (!trade) {
        return undefined;
    }

    const { tradeType } = trade;
    switch (tradeType) {
        case 'buy':
            return getBuyTradeStatusStep(trade.data.status);
        case 'exchange':
            return getExchangeTradeStatusStep(trade.data.status);
        case 'sell':
            return getSellTradeStatusStep(trade.data.status);

        default:
            return exhaustive(tradeType);
    }
};

export type TradeStatusStep = ReturnType<typeof getTradeStatusStep>;

export const getRandomAccountDescriptor = () => getWeakRandomId(20);

export const getTradeTitle = (trade: TradingTransaction, translate: Translate) => {
    const { tradeType } = trade;
    switch (tradeType) {
        case 'buy':
            return translate('moduleTrading.tradeHistory.detail.buy');
        case 'exchange':
            return translate('moduleTrading.tradeHistory.detail.exchange');
        case 'sell':
            return translate('moduleTrading.tradeHistory.detail.sell');

        default:
            return exhaustive(tradeType);
    }
};

export const getFormDraftKeyPrefixFromTradingType = (tradingType: TradingType) =>
    `trading-${tradingType}` as const satisfies FormDraftKeyPrefix;

export const getErrorStrFromThunkRejectedValue = (rejectedValue: unknown) => {
    const asAny = rejectedValue as any;
    if (asAny?.error?.error) {
        return `[${asAny.error.error}]: ${asAny.error.message ?? 'No description'}`;
    }

    if (asAny?.error?.message) {
        return asAny.error.message;
    }

    if (rejectedValue instanceof Error) {
        return rejectedValue.message;
    }

    if (typeof rejectedValue === 'string') {
        return rejectedValue;
    }

    return 'Unknown error';
};
