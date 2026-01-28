import { FormProvider } from 'react-hook-form';

import { useSelector } from 'src/hooks/suite';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingSelectedOffer } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOffer';

const TradingSellConfirmLoaded = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellContextValues = useTradingSellForm({
        selectedAccount,
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

export const TradingSellConfirm = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    return <TradingSellConfirmLoaded selectedAccount={selectedAccount} />;
};
