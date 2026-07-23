import { type BuyTradeStatus } from 'invity-api';

import {
    type DetailHeaderMessages,
    processingHeaderMessages,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

export const getBuyDetailHeaderMessages = (tradeStatus?: BuyTradeStatus): DetailHeaderMessages =>
    tradeStatus === 'APPROVAL_PENDING'
        ? processingHeaderMessages
        : { title: 'TR_BUY_HEADER_TITLE', description: 'TR_TRADING_HEADER_DESCRIPTION' };
