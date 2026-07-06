import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailExchange } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchange';

export const TradingExchangeDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'exchange',
    });

    const provider = useSelector(state =>
        selectTradingProviderByNameAndTradeType(
            state,
            tradingDetailContext.trade?.data.exchange,
            'exchange',
        ),
    );

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer provider={provider}>
                <TradingDetailExchange />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
