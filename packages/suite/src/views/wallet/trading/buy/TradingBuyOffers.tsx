import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingOffers } from 'src/views/wallet/trading/common/TradingOffers/TradingOffers';

const TradingBuyOffersComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyFormContextValues = useTradingBuyForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <TradingFormContext.Provider value={tradingBuyFormContextValues}>
            <TradingOffers />
        </TradingFormContext.Provider>
    );
};

export const TradingBuyOffers = () => (
    <span data-testid="@trading/buy-offers">
        <TradingContainer SectionComponent={TradingBuyOffersComponent} />
    </span>
);
