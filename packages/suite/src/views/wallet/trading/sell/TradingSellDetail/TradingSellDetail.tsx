import { useSelector } from '@suite-common/redux-utils';
import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

import { TradingSellDetailContent } from './TradingSellDetailContent';

export const TradingSellDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'sell',
    });

    const provider = useSelector(state =>
        selectTradingProviderByNameAndTradeType(
            state,
            tradingDetailContext.trade?.data.exchange,
            'sell',
        ),
    );

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer provider={provider}>
                <TradingSellDetailContent />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
