import { TradingDetail, TradingSellDetailContent } from '@trezor/suite';

export const TradingSellDetailPage = () => (
    <TradingDetail tradeType="sell">
        <TradingSellDetailContent />
    </TradingDetail>
);
