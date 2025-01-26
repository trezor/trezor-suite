import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailBuy } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuy';

const TradingBuyDetailComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingDetailContext = useTradingDetail({
        selectedAccount,
        tradeType: 'buy',
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingDetailBuy />
        </TradingDetailContext.Provider>
    );
};

export const TradingBuyDetail = () => (
    <TradingContainer SectionComponent={TradingBuyDetailComponent} />
);
