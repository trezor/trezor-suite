import { type TradingFlowStackRoutes } from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { type TradingFlowStackScreenProps } from '@suite-native/trading-types';

import { TradingTransactionReview } from '../components/reviewOutputs/TradingTransactionReview';
import { useSellFlow } from '../hooks/sell/useSellFlow';

type TradingSellTransactionReviewScreenProps =
    TradingFlowStackScreenProps<TradingFlowStackRoutes.TradingSellTransactionReview>;

export const TradingSellTransactionReviewScreen = ({
    route,
}: TradingSellTransactionReviewScreenProps) => {
    const { accountKey, tokenContract, orderId } = route.params;

    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useSellFlow();

    const analyticsReportCallback = useSellAnalyticReportCallback();

    return (
        <TradingTransactionReview
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType="sell"
            signAndSendTransaction={signAndSendTransaction}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
            reportToAnalytics={analyticsReportCallback}
        />
    );
};
