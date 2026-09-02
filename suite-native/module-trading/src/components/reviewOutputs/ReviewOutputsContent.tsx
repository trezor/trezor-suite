import { memo } from 'react';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType, ScreenHeader } from '@suite-native/navigation';
import { TxValidityTimer } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ReviewOutputsBody } from './ReviewOutputsBody';
import { ReviewOutputsFooter } from './ReviewOutputsFooter';
import type { UseTradingTransactionReturnProps } from '../../hooks/general/useTradingTransaction';
import { useDelayedReviewOutputListDisplayFlag } from '../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import {
    type UseTradingOutputsReviewScreenControlsProps,
    useTradingOutputsReviewScreenControls,
} from '../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export type ReviewOutputsContentProps = UseTradingOutputsReviewScreenControlsProps &
    Pick<UseTradingTransactionReturnProps, 'isTransactionSendConsentRequested'> & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
    } & (
        | {
              tradingType: 'sell';
              exchangeFlowType?: undefined;
          }
        | {
              tradingType: 'exchange';
              exchangeFlowType: ExchangeFlowType;
          }
    );

export const ReviewOutputsContent = memo(
    ({
        accountKey,
        tokenContract,
        orderId,
        tradingType,
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
        reportToAnalytics,
        exchangeFlowType,
    }: ReviewOutputsContentProps) => {
        const { applyStyle } = useNativeStyles();
        const {
            isTransactionAlreadySigned,
            confirmOnTrezorRef,
            showTimer,
            secondsLeft,
            isPastDeadline,
            isBroadcasting,
            onRetry,
            isRetryDisabled,
            handleSendTransaction,
        } = useTradingOutputsReviewScreenControls({
            orderId,
            accountKey,
            exchangeFlowType,
            signAndSendTransaction,
            resolveTransactionSendConsent,
            reportToAnalytics,
        });
        const shouldDisplayReviewList = useDelayedReviewOutputListDisplayFlag();

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
                    <VStack spacing="sp16">
                        {showTimer && (
                            <TxValidityTimer
                                secondsLeft={secondsLeft}
                                isPastDeadline={isPastDeadline}
                                isBroadcasting={isBroadcasting}
                                onRetry={onRetry}
                                isRetryDisabled={isRetryDisabled}
                            />
                        )}
                        <ReviewOutputsBody
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                            exchangeFlowType={exchangeFlowType}
                            shouldDisplayReviewList={shouldDisplayReviewList}
                            tradingType={tradingType}
                        />
                    </VStack>
                    {isTransactionAlreadySigned ? (
                        <ReviewOutputsFooter
                            isConsentRequested={isTransactionSendConsentRequested}
                            isPastDeadline={isPastDeadline}
                            isSendInProgress={isBroadcasting}
                            onSend={handleSendTransaction}
                            testID="@trading/outputs-review/footer"
                        />
                    ) : (
                        <Box style={applyStyle(spacerStyle)} />
                    )}
                </VStack>
            </ConfirmOnTrezorWrapper>
        );
    },
);
