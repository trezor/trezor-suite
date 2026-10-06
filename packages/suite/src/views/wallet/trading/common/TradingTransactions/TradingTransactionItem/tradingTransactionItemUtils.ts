import {
    type BuyTradeStatus,
    type CryptoId,
    type ExchangeTradeStatus,
    type SellTradeStatus,
} from 'invity-api';

import { type TranslationKey } from '@suite/intl';
import {
    type TradingTradeType,
    type TradingTransaction,
    exchangeUtils,
    getTradeOperationData,
    sellUtils,
} from '@suite-common/trading';
import { type IconCircleIntent, type IconComponent } from '@trezor/components';
import { CheckIcon, SpinnerGapIcon, WarningIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

import { getStatusMessage as getBuyStatusMessage } from 'src/utils/wallet/trading/buyUtils';

export type TradingTransactionSide =
    | { type: 'crypto'; amount: string; cryptoId: CryptoId }
    | { type: 'fiat'; amount: string; fiatCurrency: string };

export type TradingTransactionSides = {
    from: TradingTransactionSide;
    to: TradingTransactionSide;
};

export type TradingTransactionStatusData = {
    icon: IconComponent;
    intent: IconCircleIntent;
    messageId: TranslationKey;
};

const getCryptoSide = (
    amount: string | undefined,
    cryptoId: CryptoId | undefined,
): TradingTransactionSide | undefined =>
    amount && cryptoId ? { type: 'crypto', amount, cryptoId } : undefined;

const getFiatSide = (
    amount: string | undefined,
    fiatCurrency: string | undefined,
): TradingTransactionSide | undefined =>
    amount && fiatCurrency ? { type: 'fiat', amount, fiatCurrency } : undefined;

export const getTradingTransactionSides = (
    trade: TradingTradeType,
): TradingTransactionSides | undefined => {
    const operation = getTradeOperationData(trade);

    if (operation.isFromCrypto === undefined) {
        return undefined;
    }

    const from = operation.isFromCrypto
        ? getCryptoSide(operation.fromValue, operation.fromCurrency)
        : getFiatSide(operation.fromValue, operation.fromCurrency);
    const to = operation.isToCrypto
        ? getCryptoSide(operation.toValue, operation.toCurrency)
        : getFiatSide(operation.toValue, operation.toCurrency);

    if (!from || !to) {
        return undefined;
    }

    return { from, to };
};

const getBuyStatusData = (status: BuyTradeStatus): TradingTransactionStatusData => {
    const messageId = getBuyStatusMessage(status);

    switch (messageId) {
        case 'TR_BUY_STATUS_PENDING':
        case 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY':
        case 'TR_BUY_STATUS_ACTION_REQUIRED':
            return { icon: SpinnerGapIcon, intent: 'warning', messageId };
        case 'TR_BUY_STATUS_ERROR':
            return { icon: WarningIcon, intent: 'critical', messageId };
        case 'TR_BUY_STATUS_SUCCESS':
            return { icon: CheckIcon, intent: 'brand', messageId };
        default:
            return exhaustive(messageId);
    }
};

const getSellStatusData = (status: SellTradeStatus): TradingTransactionStatusData => {
    const messageId = sellUtils.getStatusMessage(status);

    switch (messageId) {
        case 'TR_SELL_STATUS_PENDING':
            return { icon: SpinnerGapIcon, intent: 'warning', messageId };
        case 'TR_SELL_STATUS_ERROR':
            return { icon: WarningIcon, intent: 'critical', messageId };
        case 'TR_SELL_STATUS_SUCCESS':
            return { icon: CheckIcon, intent: 'brand', messageId };
        default:
            return exhaustive(messageId);
    }
};

const getExchangeStatusData = (status: ExchangeTradeStatus): TradingTransactionStatusData => {
    const messageId = exchangeUtils.getStatusMessage(status);

    switch (messageId) {
        case 'TR_EXCHANGE_STATUS_CONFIRMING':
        case 'TR_EXCHANGE_STATUS_CONVERTING':
            return { icon: SpinnerGapIcon, intent: 'warning', messageId };
        case 'TR_EXCHANGE_STATUS_KYC':
            return { icon: WarningIcon, intent: 'warning', messageId };
        case 'TR_EXCHANGE_STATUS_ERROR':
            return { icon: WarningIcon, intent: 'critical', messageId };
        case 'TR_EXCHANGE_STATUS_SUCCESS':
            return { icon: CheckIcon, intent: 'brand', messageId };
        default:
            return exhaustive(messageId);
    }
};

export const getTradingTransactionStatusData = (
    trade: TradingTransaction,
): TradingTransactionStatusData | undefined => {
    switch (trade.tradeType) {
        case 'buy':
            return trade.data.status && getBuyStatusData(trade.data.status);
        case 'sell':
            return trade.data.status && getSellStatusData(trade.data.status);
        case 'exchange':
            return trade.data.status && getExchangeStatusData(trade.data.status);
        default:
            return exhaustive(trade);
    }
};
