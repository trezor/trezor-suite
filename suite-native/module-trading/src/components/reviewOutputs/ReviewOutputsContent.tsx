import { type TradingType } from '@suite-common/trading';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { ReviewOutputItemList } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReviewOutputsFooter } from './ReviewOutputsFooter';
import { ReviewOutputsSkeleton } from './ReviewOutputsSkeleton';
import type { UseTradingTransactionReturnProps } from '../../hooks/general/useTradingTransaction';
import { useDelayedReviewOutputListDisplayFlag } from '../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import {
    type UseTradingOutputsReviewScreenControlsProps,
    useTradingOutputsReviewScreenControls,
} from '../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';
import { getFormDraftKeyPrefixFromTradingType } from '../../utils/general/utils';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export type ReviewOutputsContentProps = UseTradingOutputsReviewScreenControlsProps &
    Pick<
        UseTradingTransactionReturnProps,
        'isTransactionSendConsentRequested' | 'resolveTransactionSendConsent'
    > & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
        tradingType: TradingType;
    };

export const ReviewOutputsContent = ({
    accountKey,
    tokenContract,
    orderId,
    tradingType,
    signAndSendTransaction,
    isTransactionSendConsentRequested,
    resolveTransactionSendConsent,
    reportToAnalytics,
}: ReviewOutputsContentProps) => {
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
            <VStack
                flex={1}
                spacing="sp16"
                justifyContent="space-between"
                testID="@trading/outputs-review"
            >
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
