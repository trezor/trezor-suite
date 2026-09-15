import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';

import { ReviewOutputsContent } from '../components/reviewOutputs/ReviewOutputsContent';
import { useSellFlow } from '../hooks/sell/useSellFlow';

type TradingSellTransactionReviewScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingSellTransactionReview
>;

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
        <ReviewOutputsContent
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
