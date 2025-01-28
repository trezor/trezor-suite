import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingSellOffersComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellFormContextValues = useTradingSellForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingSellFormContextValues}>
            <TradingOffers />
        </TradingFormContext.Provider>
    );
};
export const TradingSellOffers = () => (
    <TradingContainer SectionComponent={TradingSellOffersComponent} />
);
