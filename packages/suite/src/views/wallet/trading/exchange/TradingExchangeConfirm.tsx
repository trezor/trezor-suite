import { memo } from 'react';

import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

export const TradingExchangeConfirm = memo(() => {
    const tradingExchangeContextValues = useTradingExchangeForm({
        pageType: 'confirm',
    });

    const provider = getTradeProvider({
        trade: tradingExchangeContextValues.selectedQuote,
        providerInfo: getProvidersInfoProps(tradingExchangeContextValues),
    });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValues}>
            <TradingContainer SectionComponent={TradingSelectedOffer} provider={provider} />
        </TradingFormContext.Provider>
    );
});
