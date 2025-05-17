import {
    BuyTradeFinalStatus,
    BuyTradeStatus,
    CryptoId,
    ExchangeTradeFinalStatus,
    ExchangeTradeStatus,
    SellTradeFinalStatus,
    SellTradeStatus,
} from 'invity-api';

import { UnreachableCaseError } from '@suite-common/suite-utils';
import { TradingTradeStatusType, TradingTransaction, TradingType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { getWeakRandomId } from '@trezor/utils';

import { TRADING_URL_DEFAULT_BACK } from './formUtils';

export const tradeFinalStatuses: Record<TradingType, TradingTradeStatusType[]> = {
    buy: ['SUCCESS', 'ERROR', 'BLOCKED'] satisfies BuyTradeFinalStatus[],
    sell: ['SUCCESS', 'ERROR', 'BLOCKED', 'CANCELLED', 'REFUNDED'] satisfies SellTradeFinalStatus[],
    exchange: ['SUCCESS', 'ERROR', 'KYC'] satisfies ExchangeTradeFinalStatus[],
};

export const isFinalStatus = (
    tradingType: TradingType,
    tradeStatus: TradingTradeStatusType | undefined,
) => (tradeStatus ? tradeFinalStatuses[tradingType].includes(tradeStatus) : false);

export const getTradeOperationData = (
    transaction: TradingTransaction | undefined,
): {
    fromValue: string | undefined;
    fromCryptoId: CryptoId | undefined;
    toValue: string | undefined;
    toCryptoId: CryptoId | undefined;
} => {
    if (!transaction) {
        return {
            fromValue: undefined,
            fromCryptoId: undefined,
            toValue: undefined,
            toCryptoId: undefined,
        };
    }

    const { tradeType } = transaction;
    switch (tradeType) {
        case 'buy': {
            const buy = transaction.data;

            return {
                fromValue: buy.fiatStringAmount,
                fromCryptoId: buy.fiatCurrency as CryptoId | undefined,
                toValue: buy.receiveStringAmount,
                toCryptoId: buy.receiveCurrency,
            };
        }
        case 'exchange': {
            const exchange = transaction.data;

            return {
                fromValue: exchange.sendStringAmount,
                fromCryptoId: exchange.send,
                toValue: exchange.receiveStringAmount,
                toCryptoId: exchange.receive,
            };
        }
        case 'sell': {
            const sell = transaction.data;

            return {
                fromValue: sell.cryptoStringAmount,
                fromCryptoId: sell.cryptoCurrency,
                toValue: sell.fiatStringAmount,
                toCryptoId: sell.fiatCurrency as CryptoId | undefined,
            };
        }

        default:
            throw new UnreachableCaseError(tradeType);
    }
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
            throw new UnreachableCaseError(tradeType);
    }
};

export const doesUrlContainCloseCallbackUrl = (url: string, closeCallbackUrl: string) =>
    url.includes(closeCallbackUrl) || url.includes(TRADING_URL_DEFAULT_BACK);

export const getRandomAccountDescriptor = () => getWeakRandomId(20);

export const getTradeTitle = (
    trade: TradingTransaction,
    translate: ReturnType<typeof useTranslate>['translate'],
) => {
    const { tradeType } = trade;
    switch (tradeType) {
        case 'buy':
            return translate('moduleTrading.tradeHistory.detail.buy');
        case 'exchange':
            return translate('moduleTrading.tradeHistory.detail.exchange');
        case 'sell':
            return translate('moduleTrading.tradeHistory.detail.sell');

        default:
            throw new UnreachableCaseError(tradeType);
    }
};
