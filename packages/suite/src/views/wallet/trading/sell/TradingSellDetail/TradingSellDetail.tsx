import { TradingDetail } from 'src/views/wallet/trading/common/TradingDetail/TradingDetail';

import { TradingSellDetailContent } from './TradingSellDetailContent';

export const TradingSellDetail = () => (
    <TradingDetail tradeType="sell">
        <TradingSellDetailContent />
    </TradingDetail>
);
