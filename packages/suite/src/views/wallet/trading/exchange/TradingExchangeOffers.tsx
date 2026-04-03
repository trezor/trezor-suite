import { memo } from 'react';

import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingExchangeOffersLoaded = memo(() => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValues}>
            <TradingOffers />
        </TradingFormContext.Provider>
    );
});

export const TradingExchangeOffers = () => (
    <TradingContainer SectionComponent={TradingExchangeOffersLoaded} />
);
