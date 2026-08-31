import { useSelector } from '@suite-common/redux-utils';
import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

import { TradingExchangeDetailContent } from './TradingExchangeDetailContent';

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
                <TradingExchangeDetailContent />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
