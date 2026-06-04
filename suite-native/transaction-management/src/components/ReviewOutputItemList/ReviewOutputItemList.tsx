import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormDraftWithSendKeyPrefix,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { ExchangeFlowType } from '@suite-native/navigation';

import { ReviewOutputItem, type ReviewOutputItemProps } from './ReviewOutputItem';
import { ReviewOutputSummaryItem } from './ReviewOutputSummaryItem';
import { LIST_VERTICAL_SPACING, useActiveStepOffset } from '../../hooks';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputsFromDraft,
} from '../../selectors';
import { SlidingFooterOverlay } from '../SlidingFooterOverlay';

export type ReviewOutputItemListProps = {
    prefix: FormDraftWithSendKeyPrefix;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
    contentBuilder?: ReviewOutputItemProps['contentBuilder'];
};

export const ReviewOutputItemList = ({
    prefix,
    accountKey,
    tokenContract,
    flowType,
    contentBuilder,
}: ReviewOutputItemListProps) => {
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewActiveStepIndex(state, prefix, accountKey, tokenContract),
    );
    const reviewOutputs =
        useSelector((state: TransactionReviewOutputsState) =>
            selectTransactionReviewOutputsFromDraft(state, prefix, accountKey, tokenContract),
        ) || undefined;
    const summaryOutput =
        useSelector((state: TransactionReviewOutputsState) =>
            selectReviewSummaryOutput(state, prefix, accountKey, tokenContract),
        ) || undefined;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!account) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="transactionManagement.review.outputs.noAccount" />}
            />
        );
    }

    const { symbol: accountSymbol, networkType } = account;
    const isTron = networkType === 'tron';
    const isSolana = networkType === 'solana';

    return (
        <>
            {reviewOutputs && (
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    {reviewOutputs.map((output, index) => (
                        <ReviewOutputItem
                            key={`${output.type}-${output.value}`}
                            accountKey={accountKey}
                            reviewOutput={output}
                            onLayout={event => handleReadListItemHeight(event, index)}
                            tokenContract={tokenContract}
                            flowType={flowType}
                            contentBuilder={contentBuilder}
                        />
                    ))}
                    {!isTron && (
                        <ReviewOutputSummaryItem
                            accountKey={accountKey}
                            summaryOutput={summaryOutput}
                            symbol={accountSymbol}
                            tokenContract={tokenContract}
                            onLayout={event =>
                                handleReadListItemHeight(event, reviewOutputs.length)
                            }
                            flowType={flowType}
                        />
                    )}
                </VStack>
            )}
            {!isTransactionAlreadySigned && !isSolana && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
