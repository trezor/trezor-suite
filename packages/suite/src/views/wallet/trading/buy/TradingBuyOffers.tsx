import { FormProvider } from 'react-hook-form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingBuyOffersComponent = () => {
    const tradingBuyFormContextValues = useTradingBuyForm({
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingBuyFormContextValues}>
            <FormProvider {...tradingBuyFormContextValues.methods}>
                <TradingOffers />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingBuyOffers = () => (
    <span data-testid="@trading/buy-offers">
        <TradingContainer SectionComponent={TradingBuyOffersComponent} />
    </span>
);
