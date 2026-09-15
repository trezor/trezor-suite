import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { ErrorMessage } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';
import { getFormDraftKeyPrefixFromTradingType } from '@suite-native/trading-quote-utils';
import {
    ReviewOutputItem,
    ReviewOutputSummaryItem,
    type TransactionReviewOutputsState,
    selectReviewSummaryOutput,
    selectTransactionReviewOutputsFromDraft,
} from '@suite-native/transaction-management';
import { TransactionReviewScreen } from '@suite-native/transaction-review';

import { ReviewOutputsSkeleton } from './ReviewOutputsSkeleton';
import { SignDataMessageReview } from './SignDataMessageReview';
import type { UseTradingTransactionReturnProps } from '../../hooks/general/useTradingTransaction';
import { useDelayedReviewOutputListDisplayFlag } from '../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import { useTradingContentBuilder } from '../../hooks/reviewOutputs/useTradingContentBuilder';
import {
    type UseTradingOutputsReviewScreenControlsProps,
    useTradingOutputsReviewScreenControls,
} from '../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';

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
        const {
            isTransactionAlreadySigned,
            confirmOnTrezorRef,
            closeSheet,
            revealConfirmOnTrezorSheet,
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
        const contentBuilder = useTradingContentBuilder();

        const prefix = getFormDraftKeyPrefixFromTradingType(tradingType);

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );

        const reviewOutputs =
            useSelector((state: TransactionReviewOutputsState) =>
                selectTransactionReviewOutputsFromDraft(state, prefix, accountKey, tokenContract),
            ) || undefined;

        const summaryOutput =
            useSelector((state: TransactionReviewOutputsState) =>
                selectReviewSummaryOutput(state, prefix, accountKey, tokenContract),
            ) || undefined;

        // The button resolves the send consent the in-flight sign-and-send
        // orchestration is awaiting; its completion is reported through
        // nextStep/onError there, so there is no result to await here.
        const onSendTransaction = () => {
            handleSendTransaction();

            return Promise.resolve(undefined);
        };

        const getCustomOutputsList = () => {
            if (exchangeFlowType === 'sign-data') {
                return () => <SignDataMessageReview />;
            }

            if (!shouldDisplayReviewList) {
                return () => <ReviewOutputsSkeleton />;
            }

            if (!account) {
                return () => (
                    <ErrorMessage
                        errorMessage={
                            <Translation id="transactionManagement.review.outputs.noAccount" />
                        }
                    />
                );
            }

            return undefined;
        };

        const txValidityFlow = {
            showTimer,
            secondsLeft,
            isPastDeadline,
            isBroadcasting,
            onRetry,
            isRetryDisabled,
        };

        const sheetController = { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet };

        return (
            <TransactionReviewScreen
                accountKey={accountKey}
                tokenContract={tokenContract}
                reviewOutputs={reviewOutputs}
                flowType={exchangeFlowType}
                titleTranslationId="moduleTrading.tradingReviewOutputs.title"
                summaryTranslationId="transactionManagement.review.outputs.summary.label"
                sendButtonTranslationId="moduleTrading.tradingReviewOutputs.submitButton"
                sendButtonTestId="@trading/outputs-review/footer/submit-button"
                footerTestId="@trading/outputs-review/footer"
                testID="@trading/outputs-review"
                isTransactionAlreadySigned={isTransactionAlreadySigned}
                isSendButtonDisabled={!isTransactionSendConsentRequested || isPastDeadline}
                isSendButtonLoading={isBroadcasting}
                onSendTransaction={onSendTransaction}
                renderOutputItem={({ output, onLayout }) => (
                    <ReviewOutputItem
                        accountKey={accountKey}
                        reviewOutput={output}
                        onLayout={onLayout}
                        tokenContract={tokenContract}
                        flowType={exchangeFlowType}
                        contentBuilder={contentBuilder}
                    />
                )}
                renderSummaryItem={({ onLayout }) =>
                    !!account &&
                    account.networkType !== 'tron' && (
                        <ReviewOutputSummaryItem
                            accountKey={accountKey}
                            prefix={prefix}
                            summaryOutput={summaryOutput}
                            symbol={account.symbol}
                            tokenContract={tokenContract}
                            onLayout={onLayout}
                            flowType={exchangeFlowType}
                        />
                    )
                }
                renderOutputsList={getCustomOutputsList()}
                txValidityFlow={txValidityFlow}
                sheetController={sheetController}
                isBackInterceptorEnabled={false}
            />
        );
    },
);
