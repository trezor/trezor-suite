import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailBuy } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuy';

export const TradingBuyDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'buy',
    });

    const provider = getTradeProvider({
        trade: tradingDetailContext.trade?.data,
        providerInfo: tradingDetailContext.info?.providerInfos,
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer SectionComponent={TradingDetailBuy} provider={provider} />
        </TradingDetailContext.Provider>
    );
};
