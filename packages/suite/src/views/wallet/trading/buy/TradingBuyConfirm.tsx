import { FormProvider } from 'react-hook-form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

const TradingBuyConfirmComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyContextValues = useTradingBuyForm({
        selectedAccount,
        pageType: 'confirm',
    });

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingSelectedOffer />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingBuyConfirm = () => (
    <TradingContainer SectionComponent={TradingBuyConfirmComponent} />
);
