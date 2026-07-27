import { type SellTradeStatus } from 'invity-api';

import {
    type DetailHeaderMessages,
    processingHeaderMessages,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

const sellPreSendStatuses: SellTradeStatus[] = [
    'REQUESTING',
    'LOGIN_REQUEST',
    'SITE_ACTION_REQUEST',
    'SUBMITTED',
    'SEND_CRYPTO',
];

export const getSellDetailHeaderMessages = (tradeStatus: SellTradeStatus): DetailHeaderMessages =>
    sellPreSendStatuses.includes(tradeStatus)
        ? { title: 'TR_SELL_HEADER_TITLE', description: 'TR_TRADING_HEADER_DESCRIPTION' }
        : processingHeaderMessages;
