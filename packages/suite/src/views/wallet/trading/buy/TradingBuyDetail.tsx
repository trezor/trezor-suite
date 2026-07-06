import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailBuy } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuy';

export const TradingBuyDetail = () => {
    const tradingDetailContext = useTradingDetail({
        tradeType: 'buy',
    });

    const provider = useSelector(state =>
        selectTradingProviderByNameAndTradeType(
            state,
            tradingDetailContext.trade?.data.exchange,
            'buy',
        ),
    );

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer provider={provider}>
                <TradingDetailBuy />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
