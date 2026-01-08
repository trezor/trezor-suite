import { StackProps, TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';

import { DeviceGuardedReviewOutputs } from '../components/reviewOutputs/DeviceGuardedReviewOutputs';
import { useExchangeAnalyticReportCallback } from '../hooks/exchange/useExchangeAnalyticReportCallback';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { useSellAnalyticReportCallback } from '../hooks/sell/useSellAnalyticReportCallback';
import { useSellFlow } from '../hooks/sell/useSellFlow';

export const TradingExchangeOutputsReviewScreen = ({
    route,
}: StackProps<TradingStackParamList, TradingStackRoutes.TradingExchangeOutputsReview>) => {
    const { accountKey, tokenContract, orderId } = route.params;
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useExchangeFlow();
    const analyticsReportCallback = useExchangeAnalyticReportCallback();

    return (
        <DeviceGuardedReviewOutputs
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType="exchange"
            signAndSendTransaction={signAndSendTransaction}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
            reportToAnalytics={analyticsReportCallback}
        />
    );
};

export const TradingSellOutputsReviewScreen = ({
    route,
}: StackProps<TradingStackParamList, TradingStackRoutes.TradingSellOutputsReview>) => {
    const { accountKey, tokenContract, orderId } = route.params;
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useSellFlow();
    const analyticsReportCallback = useSellAnalyticReportCallback();

    return (
        <DeviceGuardedReviewOutputs
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
