import { TradingType } from '@suite-common/trading';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { ReviewOutputItemList } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReviewOutputsFooter } from '../components/reviewOutputs/ReviewOutputsFooter';
import { ReviewOutputsSkeleton } from '../components/reviewOutputs/ReviewOutputsSkeleton';
import { useExchangeAnalyticReportCallback } from '../hooks/exchange/useExchangeAnalyticReportCallback';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import type { UseTradingTransactionReturnProps } from '../hooks/general/useTradingTransaction';
import { useDelayedReviewOutputListDisplayFlag } from '../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import {
    UseTradingOutputsReviewScreenControlsProps,
    useTradingOutputsReviewScreenControls,
} from '../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';
import { useSellAnalyticReportCallback } from '../hooks/sell/useSellAnalyticReportCallback';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { getFormDraftKeyPrefixFromTradingType } from '../utils/general/utils';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

type TradingOutputsBaseReviewScreenParams = UseTradingOutputsReviewScreenControlsProps &
    Pick<
        UseTradingTransactionReturnProps,
        'isTransactionSendConsentRequested' | 'resolveTransactionSendConsent'
    > & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
        tradingType: TradingType;
    };

const TradingOutputsBaseReviewScreen = ({
    accountKey,
    tokenContract,
    orderId,
    tradingType,
    signAndSendTransaction,
    isTransactionSendConsentRequested,
    resolveTransactionSendConsent,
    reportToAnalytics,
}: TradingOutputsBaseReviewScreenParams) => {
    const { applyStyle } = useNativeStyles();
    const { isTransactionAlreadySigned, confirmOnTrezorRef } =
        useTradingOutputsReviewScreenControls({
            orderId,
            accountKey,
            signAndSendTransaction,
            reportToAnalytics,
        });
    const shouldDisplayReviewList = useDelayedReviewOutputListDisplayFlag();

    const prefix = getFormDraftKeyPrefixFromTradingType(tradingType);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradingReviewOutputs.title" />}
                    closeActionType="close"
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                {shouldDisplayReviewList ? (
                    <ReviewOutputItemList
                        prefix={prefix}
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                ) : (
                    <ReviewOutputsSkeleton />
                )}
                {isTransactionAlreadySigned ? (
                    <ReviewOutputsFooter
                        isConsentRequested={isTransactionSendConsentRequested}
                        resolveConsent={resolveTransactionSendConsent}
                        testID="@trading/outputs-review/footer"
                    />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

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
        <TradingOutputsBaseReviewScreen
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
        <TradingOutputsBaseReviewScreen
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
