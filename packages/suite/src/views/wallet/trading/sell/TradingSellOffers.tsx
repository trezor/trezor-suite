import { FormProvider } from 'react-hook-form';

import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSellOffersContent } from 'src/views/wallet/trading/common/TradingOffers/TradingSellOffersContent';

import { TradingSellContextProvider } from './TradingSellContext';

const TradingSellOffersComponent = () => {
    const tradingSellFormContextValues = useTradingSellForm({
        pageType: 'offers',
    });

    return (
        <TradingSellContextProvider value={tradingSellFormContextValues}>
            <FormProvider {...tradingSellFormContextValues.methods}>
                <TradingSellOffersContent />
            </FormProvider>
        </TradingSellContextProvider>
    );
};
export const TradingSellOffers = () => (
    <TradingContainer SectionComponent={TradingSellOffersComponent} />
);
