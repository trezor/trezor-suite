import { TradingDetail } from 'src/views/wallet/trading/common/TradingDetail/TradingDetail';

import { TradingExchangeDetailContent } from './TradingExchangeDetailContent';

export const TradingExchangeDetail = () => (
    <TradingDetail tradeType="exchange">
        <TradingExchangeDetailContent />
    </TradingDetail>
);
