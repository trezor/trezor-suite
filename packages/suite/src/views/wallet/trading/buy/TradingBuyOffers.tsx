import { FormProvider } from 'react-hook-form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingBuyOffersContent } from 'src/views/wallet/trading/common/TradingOffers/TradingBuyOffersContent';

import { TradingBuyContextProvider } from './TradingBuyContext';

const TradingBuyOffersComponent = () => {
    const tradingBuyFormContextValues = useTradingBuyForm({
        pageType: 'offers',
    });

    return (
        <TradingBuyContextProvider value={tradingBuyFormContextValues}>
            <FormProvider {...tradingBuyFormContextValues.methods}>
                <TradingBuyOffersContent />
            </FormProvider>
        </TradingBuyContextProvider>
    );
};

export const TradingBuyOffers = () => (
    <span data-testid="@trading/buy-offers">
        <TradingContainer SectionComponent={TradingBuyOffersComponent} />
    </span>
);
