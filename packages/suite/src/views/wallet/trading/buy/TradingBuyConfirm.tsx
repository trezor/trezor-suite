import { FormProvider } from 'react-hook-form';

import { useSelector } from 'src/hooks/suite';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

const TradingBuyConfirmLoaded = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyContextValues = useTradingBuyForm({
        selectedAccount,
        pageType: 'confirm',
    });

    const provider = getTradeProvider({
        trade: tradingBuyContextValues.selectedQuote,
        providerInfo: getProvidersInfoProps(tradingBuyContextValues),
    });

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingContainer SectionComponent={TradingSelectedOffer} provider={provider} />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingBuyConfirm = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    return <TradingBuyConfirmLoaded selectedAccount={selectedAccount} />;
};
