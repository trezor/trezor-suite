import { UseTradingProps } from 'src/types/trading/trading';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

const TradingBuyConfirmComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyContextValues = useTradingBuyForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <TradingSelectedOffer />
        </TradingFormContext.Provider>
    );
};

export const TradingBuyConfirm = () => (
    <TradingContainer SectionComponent={TradingBuyConfirmComponent} />
);
