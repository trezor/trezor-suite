import { type SellTradeStatus } from 'invity-api';

import { isFinalStatus } from '@suite-common/trading';

import {
    type DetailHeaderMessages,
    type TradingDetailProgress,
    processingHeaderMessages,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

const sellPreSendStatuses: SellTradeStatus[] = [
    'REQUESTING',
    'LOGIN_REQUEST',
    'SITE_ACTION_REQUEST',
    'SUBMITTED',
    'SEND_CRYPTO',
];

export type SellDetailStatusStep = 'pending' | 'success' | 'error';

export type SellDetailTerminalStep = Exclude<SellDetailStatusStep, 'pending'>;

export const getSellDetailHeaderMessages = (tradeStatus: SellTradeStatus): DetailHeaderMessages =>
    sellPreSendStatuses.includes(tradeStatus)
        ? { title: 'TR_SELL_HEADER_TITLE', description: 'TR_TRADING_HEADER_DESCRIPTION' }
        : processingHeaderMessages;

export const getSellDetailStatusStep = (tradeStatus: SellTradeStatus): SellDetailStatusStep => {
    switch (tradeStatus) {
        case 'SUCCESS':
            return 'success';
        default: {
            return isFinalStatus('sell', tradeStatus) ? 'error' : 'pending';
        }
    }
};

export const getSellDetailProgress = (tradeStatus: SellTradeStatus): TradingDetailProgress => {
    if (sellPreSendStatuses.includes(tradeStatus)) {
        return 'customerAction';
    }

    return tradeStatus === 'PENDING' ? 'providerProcessing' : 'completed';
};
