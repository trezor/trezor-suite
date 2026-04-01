import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingExchangeOffersContent } from 'src/views/wallet/trading/common/TradingOffers/TradingExchangeOffersContent';

import { TradingExchangeContextProvider } from './TradingExchangeContext';

const TradingExchangeOffersComponent = () => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        pageType: 'offers',
    });

    return (
        <TradingExchangeContextProvider value={tradingExchangeContextValues}>
            <TradingExchangeOffersContent />
        </TradingExchangeContextProvider>
    );
};

export const TradingExchangeOffers = () => (
    <TradingContainer SectionComponent={TradingExchangeOffersComponent} />
);
