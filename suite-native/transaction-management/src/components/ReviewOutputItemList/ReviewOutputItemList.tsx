import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormDraftWithSendKeyPrefix,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ReviewOutputItem } from './ReviewOutputItem';
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
};

export const ReviewOutputItemList = ({
    prefix,
    accountKey,
    tokenContract,
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
    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!accountSymbol) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="transactionManagement.review.outputs.noAccount" />}
            />
        );
    }

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
                        />
                    ))}
                    <ReviewOutputSummaryItem
                        accountKey={accountKey}
                        summaryOutput={summaryOutput}
                        symbol={accountSymbol}
                        tokenContract={tokenContract}
                        onLayout={event => handleReadListItemHeight(event, reviewOutputs.length)}
                    />
                </VStack>
            )}
            {!isTransactionAlreadySigned && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
