import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailExchange } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchange';

const TradingExchangeDetailComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingDetailContext = useTradingDetail({
        selectedAccount,
        tradeType: 'exchange',
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingDetailExchange />
        </TradingDetailContext.Provider>
    );
};

export const TradingExchangeDetail = () => (
    <TradingContainer SectionComponent={TradingExchangeDetailComponent} />
);
