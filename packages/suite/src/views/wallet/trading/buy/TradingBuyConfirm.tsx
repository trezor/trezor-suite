import { FormProvider } from 'react-hook-form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

import { TradingBuyContextProvider } from './TradingBuyContext';

export const TradingBuyConfirm = () => {
    const tradingBuyContextValues = useTradingBuyForm({
        pageType: 'confirm',
    });

    const provider = getTradeProvider({
        trade: tradingBuyContextValues.selectedQuote,
        providerInfo: getProvidersInfoProps(tradingBuyContextValues),
    });

    return (
        <TradingBuyContextProvider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingContainer SectionComponent={TradingSelectedOffer} provider={provider} />
            </FormProvider>
        </TradingBuyContextProvider>
    );
};
