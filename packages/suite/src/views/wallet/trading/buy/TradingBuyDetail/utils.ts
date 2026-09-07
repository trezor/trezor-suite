import { type BuyTradeStatus } from 'invity-api';

import {
    type DetailHeaderMessages,
    type TradingDetailProgress,
    processingHeaderMessages,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

export type BuyDetailStatusStep = 'waiting' | 'processing' | 'success' | 'error' | undefined;

export type BuyDetailTerminalStep = Exclude<
    BuyDetailStatusStep,
    'waiting' | 'processing' | undefined
>;

export const getBuyDetailHeaderMessages = (tradeStatus?: BuyTradeStatus): DetailHeaderMessages =>
    tradeStatus === 'APPROVAL_PENDING'
        ? processingHeaderMessages
        : { title: 'TR_BUY_HEADER_TITLE', description: 'TR_TRADING_HEADER_DESCRIPTION' };

export const getBuyDetailStatusStep = (tradeStatus?: BuyTradeStatus): BuyDetailStatusStep => {
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

export const getBuyDetailProgress = (tradeStatus?: BuyTradeStatus): TradingDetailProgress => {
    switch (tradeStatus) {
        case 'APPROVAL_PENDING':
            return 'providerProcessing';
        case 'SUCCESS':
            return 'completed';
        default:
            return 'customerAction';
    }
};
