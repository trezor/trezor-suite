import { useSelector } from '@suite-common/redux-utils';
import { selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

import { TradingBuyDetailContent } from './TradingBuyDetailContent';

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
                <TradingBuyDetailContent />
            </TradingContainer>
        </TradingDetailContext.Provider>
    );
};
