import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import {
    type TradingTransaction,
    type TradingType,
    tradeFinalStatuses,
} from '@suite-common/trading';
import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import type { Translate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';
import { getWeakRandomId } from '@trezor/utils';

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
