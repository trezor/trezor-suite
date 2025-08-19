import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ReviewOutputItem } from './ReviewOutputItem';
import { ReviewOutputSummaryItem } from './ReviewOutputSummaryItem';
import { LIST_VERTICAL_SPACING, useActiveStepOffset } from '../../hooks/useActiveStepOffset';
import { ReviewSummaryOutput, StatefulReviewOutput } from '../../types';
import { SlidingFooterOverlay } from '../SlidingFooterOverlay';

export type ReviewOutputItemListProps = {
    accountKey: string;
    activeStep: number;
    isTransactionAlreadySigned: boolean;
    reviewOutputs?: StatefulReviewOutput[];
    summaryOutput?: ReviewSummaryOutput;
    tokenContract?: TokenAddress;
};

export const ReviewOutputItemList = ({
    accountKey,
    activeStep,
    isTransactionAlreadySigned,
    reviewOutputs,
    summaryOutput,
    tokenContract,
}: ReviewOutputItemListProps) => {
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

    return (
        <>
            {reviewOutputs && (
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    {reviewOutputs?.map((output, index) => (
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
                        symbol={account.symbol}
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
