import type { SellTradeStatus } from 'invity-api';

import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
} from '@suite-common/trading';
import { type TradeStatusStepState } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type TradeProgress = 'customerAction' | 'providerProcessing' | 'completed';

type TradeStatusStepPosition = 'customerAction' | 'providerProcessing';

export const getTradeStatusUrl = (trade: TradingTransaction): string | undefined => {
    switch (trade.tradeType) {
        case 'buy':
            return trade.data.statusUrl || trade.data.partnerData;
        case 'sell':
        case 'exchange':
            return trade.data.statusUrl ?? undefined;
        default:
            return exhaustive(trade);
    }
};

export const getBuyTradeProgress = (
    status: TradingTransactionBuy['data']['status'],
): TradeProgress | undefined => {
    switch (status) {
        case undefined:
        case 'LOGIN_REQUEST':
        case 'REQUESTING':
        case 'SUBMITTED':
        case 'WAITING_FOR_USER':
            return 'customerAction';
        case 'APPROVAL_PENDING':
            return 'providerProcessing';
        case 'SUCCESS':
            return 'completed';
        case 'ERROR':
        case 'BLOCKED':
            return undefined;
        default:
            return exhaustive(status);
    }
};

export const getSellTradeProgress = (status?: SellTradeStatus): TradeProgress | undefined => {
    switch (status) {
        case undefined:
        case 'REQUESTING':
        case 'LOGIN_REQUEST':
        case 'SITE_ACTION_REQUEST':
        case 'SUBMITTED':
        case 'SEND_CRYPTO':
            return 'customerAction';
        case 'PENDING':
            return 'providerProcessing';
        case 'SUCCESS':
            return 'completed';
        case 'ERROR':
        case 'BLOCKED':
        case 'CANCELLED':
        case 'REFUNDED':
            return undefined;
        default:
            return exhaustive(status);
    }
};

export const getExchangeTradeProgress = (
    status: TradingTransactionExchange['data']['status'],
): TradeProgress | undefined => {
    switch (status) {
        case undefined:
        case 'LOADING':
        case 'CONFIRM':
        case 'SENDING':
        case 'CONFIRMING':
        case 'APPROVAL_REQ':
        case 'APPROVAL_PENDING':
        case 'SIGN_DATA':
            return 'customerAction';
        case 'CONVERTING':
            return 'providerProcessing';
        case 'SUCCESS':
            return 'completed';
        case 'ERROR':
        case 'KYC':
            return undefined;
        default:
            return exhaustive(status);
    }
};

export const getStepState = (
    progress: TradeProgress,
    stepPosition: TradeStatusStepPosition,
): TradeStatusStepState => {
    if (progress === 'completed') {
        return 'completed';
    }

    if (stepPosition === 'customerAction') {
        return progress === 'customerAction' ? 'active' : 'completed';
    }

    return progress === 'providerProcessing' ? 'active' : 'pending';
};
