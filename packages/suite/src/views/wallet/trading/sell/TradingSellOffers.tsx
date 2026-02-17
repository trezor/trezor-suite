import { FormProvider } from 'react-hook-form';

import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingSellOffersComponent = () => {
    const tradingSellFormContextValues = useTradingSellForm({
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingSellFormContextValues}>
            <FormProvider {...tradingSellFormContextValues.methods}>
                <TradingOffers />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};
export const TradingSellOffers = () => (
    <TradingContainer SectionComponent={TradingSellOffersComponent} />
);
