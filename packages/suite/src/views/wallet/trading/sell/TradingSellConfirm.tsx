import { FormProvider } from 'react-hook-form';

import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

const TradingSellConfirmLoaded = () => {
    const tradingSellContextValues = useTradingSellForm({
        pageType: 'confirm',
    });

    const provider = getTradeProvider({
        trade: tradingSellContextValues.selectedQuote,
        providerInfo: getProvidersInfoProps(tradingSellContextValues),
    });

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <FormProvider {...tradingSellContextValues.methods}>
                <TradingContainer SectionComponent={TradingSelectedOffer} provider={provider} />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingSellConfirm = () => <TradingSellConfirmLoaded />;
