import { TradingBuyDetailContent, TradingDetail } from '@trezor/suite';

export const TradingBuyDetailPage = () => (
    <TradingDetail tradeType="buy">
        <TradingBuyDetailContent />
    </TradingDetail>
);
