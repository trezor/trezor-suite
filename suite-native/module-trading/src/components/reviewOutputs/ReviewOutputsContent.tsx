import { memo } from 'react';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType, ScreenHeader } from '@suite-native/navigation';
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
    Pick<
        UseTradingTransactionReturnProps,
        'isTransactionSendConsentRequested' | 'resolveTransactionSendConsent'
    > & {
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
        const { isTransactionAlreadySigned, confirmOnTrezorRef } =
            useTradingOutputsReviewScreenControls({
                orderId,
                accountKey,
                signAndSendTransaction,
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
                    <ReviewOutputsBody
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        exchangeFlowType={exchangeFlowType}
                        shouldDisplayReviewList={shouldDisplayReviewList}
                        tradingType={tradingType}
                    />
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
    },
);
