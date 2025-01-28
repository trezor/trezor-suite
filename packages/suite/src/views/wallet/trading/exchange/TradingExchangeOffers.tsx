import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingExchangeOffersComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValues}>
            <TradingOffers />
        </TradingFormContext.Provider>
    );
};

export const TradingExchangeOffers = () => (
    <TradingContainer SectionComponent={TradingExchangeOffersComponent} />
);
