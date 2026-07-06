import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailSell } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSell';

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
                <TradingDetailSell />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
