import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailSell } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSell';

export const TradingSellDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'sell',
    });

    const provider = getTradeProvider({
        trade: tradingDetailContext.trade?.data,
        providerInfo: tradingDetailContext.info?.providerInfos,
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer SectionComponent={TradingDetailSell} provider={provider} />
        </TradingDetailContext.Provider>
    );
};
