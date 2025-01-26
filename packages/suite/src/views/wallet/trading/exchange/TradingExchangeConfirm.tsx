import { UseTradingProps } from 'src/types/trading/trading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

const TradingExchangeConfirmComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        selectedAccount,
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
