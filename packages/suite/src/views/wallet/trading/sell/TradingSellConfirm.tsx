import { UseTradingProps } from 'src/types/trading/trading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

const TradingSellConfirmComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellContextValues = useTradingSellForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <TradingSelectedOffer />
        </TradingFormContext.Provider>
    );
};

export const TradingSellConfirm = () => (
    <TradingContainer SectionComponent={TradingSellConfirmComponent} />
);
