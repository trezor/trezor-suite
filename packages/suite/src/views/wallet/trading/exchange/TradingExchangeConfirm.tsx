import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

const TradingExchangeConfirmComponent = () => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        pageType: 'confirm',
    });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValues}>
            <TradingSelectedOffer />
        </TradingFormContext.Provider>
    );
};

export const TradingExchangeConfirm = () => (
    <TradingContainer SectionComponent={TradingExchangeConfirmComponent} />
);
