import { TradingDetail } from 'src/views/wallet/trading/common/TradingDetail/TradingDetail';

import { TradingBuyDetailContent } from './TradingBuyDetailContent';

export const TradingBuyDetail = () => (
    <TradingDetail tradeType="buy">
        <TradingBuyDetailContent />
    </TradingDetail>
);
