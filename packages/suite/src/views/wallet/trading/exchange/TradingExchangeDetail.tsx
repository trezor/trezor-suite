import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailExchange } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchange';

export const TradingExchangeDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'exchange',
    });

    const provider = getTradeProvider({
        trade: tradingDetailContext.trade?.data,
        providerInfo: tradingDetailContext.info?.providerInfos,
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer SectionComponent={TradingDetailExchange} provider={provider} />
        </TradingDetailContext.Provider>
    );
};
