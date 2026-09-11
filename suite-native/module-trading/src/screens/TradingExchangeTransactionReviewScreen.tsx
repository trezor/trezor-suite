import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { useExchangeAnalyticReportCallback } from '@suite-native/trading-analytics';

import { ReviewOutputsContent } from '../components/reviewOutputs/ReviewOutputsContent';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';

type TradingExchangeTransactionReviewScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingExchangeTransactionReview
>;

export const TradingExchangeTransactionReviewScreen = ({
    route,
}: TradingExchangeTransactionReviewScreenProps) => {
    const { accountKey, tokenContract, orderId, flowType } = route.params;

    const {
        signAndSendTransaction,
        signDataAndConfirm,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useExchangeFlow({ flowType });

    const analyticsReportCallback = useExchangeAnalyticReportCallback();

    const actionFn = flowType === 'sign-data' ? signDataAndConfirm : signAndSendTransaction;

    return (
        <ReviewOutputsContent
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType="exchange"
            signAndSendTransaction={actionFn}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
            reportToAnalytics={analyticsReportCallback}
            exchangeFlowType={flowType}
        />
    );
};
