import { SelectedAccountLoaded } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { UseTradingProps } from 'src/types/trading/trading';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailExchange } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchange';

const TradingExchangeDetailLoaded = ({ selectedAccount }: UseTradingProps) => {
    const tradingDetailContext = useTradingDetail({
        account: selectedAccount.account,
        tradeType: 'exchange',
    });

    const provider = getTradeProvider({
        trade: tradingDetailContext.trade?.data,
        providerInfo: tradingDetailContext.info?.providerInfos,
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer SectionComponent={TradingDetailExchange} provider={provider} />
        </TradingDetailContext.Provider>
    );
};

export const TradingExchangeDetail = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    // we use just type assertion here because exchange uses useTradingFormAccount() for account selection
    // so the selectedAccount is not loaded and we need to render the component anyway
    return (
        <TradingExchangeDetailLoaded selectedAccount={selectedAccount as SelectedAccountLoaded} />
    );
};
