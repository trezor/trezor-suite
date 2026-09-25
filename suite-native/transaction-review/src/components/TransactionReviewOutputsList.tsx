import { type LayoutChangeEvent, View } from 'react-native';

import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { SlidingFooterOverlay } from '@suite-native/transaction-management';

import { TransactionReviewOutputItem } from './TransactionReviewOutputItem';
import { TransactionReviewOutputSummaryItem } from './TransactionReviewOutputSummaryItem';
import { useActiveStepOffset } from '../hooks/useActiveStepOffset';
import { useTransactionReview } from '../hooks/useTransactionReview';

const getOutputKey = (output: TransactionReviewStatefulOutput) => `${output.type}-${output.value}`;

const getActiveStepIndex = (outputs: TransactionReviewStatefulOutput[]) => {
    const activeIndex = outputs.findIndex(output => output.state === 'active');

    return activeIndex === -1 ? outputs.length : activeIndex;
};

export const TransactionReviewOutputsList = () => {
    const review = useTransactionReview();

    const outputs = review.outputs ?? [];
    const activeStep = getActiveStepIndex(outputs);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!review.outputs || !review.account) return null;

    const onSummaryLayout = (event: LayoutChangeEvent) =>
        handleReadListItemHeight(event, outputs.length);

    const onOutputLayout = (event: LayoutChangeEvent, index: number) =>
        handleReadListItemHeight(event, index);

    return (
        <>
            <VStack spacing="sp16">
                {review.outputs.map((output, index) => {
                    const onLayout = (event: LayoutChangeEvent) => onOutputLayout(event, index);

                    return (
                        <TransactionReviewOutputItem
                            key={getOutputKey(output)}
                            output={output}
                            onLayout={onLayout}
                        />
                    );
                })}

                {review.renderSummaryItem
                    ? review.renderSummaryItem({ onLayout: onSummaryLayout })
                    : review.isSummaryItemEnabled && (
                          <View onLayout={onSummaryLayout}>
                              <TransactionReviewOutputSummaryItem />
                          </View>
                      )}
            </VStack>

            {!review.isTransactionAlreadySigned && review.isSlidingOverlayEnabled && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
