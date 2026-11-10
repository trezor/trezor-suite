import { TradingDetail, TradingExchangeDetailContent } from '@trezor/suite';

export const TradingExchangeDetailPage = () => (
    <TradingDetail tradeType="exchange">
        <TradingExchangeDetailContent />
    </TradingDetail>
);
