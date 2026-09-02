import { useSelector } from 'react-redux';

import { type TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { VStack } from '@suite-native/atoms';
import { Footer } from '@suite-native/trading-provider-utils';
import { getTradeOperationData } from '@suite-native/trading-quote-utils';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';

import { TradingHistoryDetailStatusStepper } from './TradeStatusStepper/TradingHistoryDetailStatusStepper';
import { TradingHistoryDetailBuyPaymentBanner } from './TradingHistoryDetailBuyPaymentBanner';
import { TradingHistoryDetailStatusAction } from './TradingHistoryDetailStatusAction';
import { TradingDetailFeedback } from '../TradeHistoryListItem/TradingDetailFeedback';

type TradingHistoryDetailProps = {
    orderId: string;
};

export const TradingHistoryDetail = ({ orderId }: TradingHistoryDetailProps) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const countryOfResidence = useSelector(selectTradingResidenceCountry);

    if (!trade) {
        return null;
    }

    const { fromCurrency, toCurrency } = getTradeOperationData(trade.data);

    return (
        <VStack spacing="sp16">
            <TradingHistoryDetailStatusAction
                providerName={trade.data.exchange}
                tradeType={trade.tradeType}
                status={trade.data.status}
            />
            <TradingHistoryDetailStatusStepper trade={trade} />
            {trade.tradeType === 'buy' && <TradingHistoryDetailBuyPaymentBanner trade={trade} />}
            <TradingDetailFeedback
                type={trade.tradeType}
                status={trade.data.status}
                provider={trade.data.exchange}
                id={trade.data.id}
                sendCurrency={fromCurrency}
                receiveCurrency={toCurrency}
                country={countryOfResidence}
            />
            <Footer />
        </VStack>
    );
};
