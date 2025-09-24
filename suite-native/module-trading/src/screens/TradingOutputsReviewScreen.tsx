import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useOutputsReviewBackInterceptor } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReviewOutputItemList } from '../components/reviewOutputs/ReviewOutputItemList';
import { ReviewOutputsFooter } from '../components/reviewOutputs/ReviewOutputsFooter';
import { ReviewOutputsSkeleton } from '../components/reviewOutputs/ReviewOutputsSkeleton';
import { useDelayedReviewOutputListDisplayFlag } from '../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import { useTradingOutputsReviewScreenControls } from '../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const TradingOutputsReviewScreen = ({
    route,
}: StackProps<TradingStackParamList, TradingStackRoutes.TradingOutputsReview>) => {
    const { accountKey, tradingType } = route.params;

    const { applyStyle } = useNativeStyles();
    const { isTransactionAlreadySigned, isConsentRequested, resolveConsent, confirmOnTrezorRef } =
        useTradingOutputsReviewScreenControls();
    const shouldDisplayReviewList = useDelayedReviewOutputListDisplayFlag();
    useOutputsReviewBackInterceptor();

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
                    <ReviewOutputItemList accountKey={accountKey} tradingType={tradingType} />
                ) : (
                    <ReviewOutputsSkeleton />
                )}
                {isTransactionAlreadySigned ? (
                    <ReviewOutputsFooter
                        isConsentRequested={isConsentRequested}
                        resolveConsent={resolveConsent}
                    />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
