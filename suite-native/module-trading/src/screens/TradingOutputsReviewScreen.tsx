import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import {
    useExchangeAnalyticReportCallback,
    useSellAnalyticReportCallback,
} from '@suite-native/trading-analytics';

import { ReviewOutputsContent } from '../components/reviewOutputs/ReviewOutputsContent';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { useSellFlow } from '../hooks/sell/useSellFlow';

export const TradingExchangeOutputsReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TradingExchangeOutputsReview>) => {
    const { accountKey, tokenContract, orderId, flowType } = route.params;
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useExchangeFlow({ flowType });
    const analyticsReportCallback = useExchangeAnalyticReportCallback();

    return (
        <ReviewOutputsContent
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType="exchange"
            signAndSendTransaction={signAndSendTransaction}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
            reportToAnalytics={analyticsReportCallback}
            exchangeFlowType={flowType}
        />
    );
};

export const TradingSellOutputsReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TradingSellOutputsReview>) => {
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
