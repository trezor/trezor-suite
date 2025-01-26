import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailSell } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSell';

const TradingSellDetailComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingDetailContext = useTradingDetail({
        selectedAccount,
        tradeType: 'sell',
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingDetailSell />
        </TradingDetailContext.Provider>
    );
};

export const TradingSellDetail = () => (
    <TradingContainer SectionComponent={TradingSellDetailComponent} />
);
