import { VStack } from '@suite-native/atoms';
import { useTransactionReview } from '../hooks/useTransactionReview';
import { TransactionReviewOutputItem } from './TransactionReviewOutputItem';
import { TransactionReviewOutputSummaryItem } from './TransactionReviewOutputSummaryItem';
import { TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import {
    selectTransactionReviewActiveStepIndex,
    SlidingFooterOverlay,
    TransactionReviewOutputsState,
} from '@suite-native/transaction-management';
import { useSelector } from 'react-redux';
import { useActiveStepOffset } from '../hooks/useActiveStepOffset';

const getOutputKey = (output: TransactionReviewStatefulOutput) => `${output.type}-${output.value}`;

export const TransactionReviewOutputsList = () => {
    const review = useTransactionReview();

    const activeStep = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewActiveStepIndex(
            state,
            review.prefix,
            review.accountKey,
            review.tokenContract,
        ),
    );

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!review.outputs || !review.account) return null;

    const isTron = review.account.networkType === 'tron';
    const isSolana = review.account.networkType === 'solana';

    return (
        <>
            <VStack spacing="sp16">
                {review.outputs.map((output, index) => (
                    <TransactionReviewOutputItem
                        key={getOutputKey(output)}
                        output={output}
                        onLayout={event => handleReadListItemHeight(event, index)}
                    />
                ))}

                {!isTron && <TransactionReviewOutputSummaryItem />}
            </VStack>

            {!review.isTransactionAlreadySigned && !isSolana && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
