import {
    type AccountKey,
    type ReviewOutput,
    type ReviewOutputState,
} from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { YieldTransactionReviewOutputItem } from './YieldTransactionReviewOutputItem';
import { YieldTransactionReviewSummaryCard } from './YieldTransactionReviewSummaryCard';
import { type YieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

type YieldTransactionReviewOutputListProps = {
    accountKey: AccountKey;
    activeStep?: number;
    isSigned?: boolean;
    preview: Pick<YieldReviewPreview, 'evmTransactionPurpose' | 'outputs' | 'summary'>;
};

type GetStatefulOutputsParams = {
    activeStep?: number;
    isSigned?: boolean;
    outputs: YieldReviewPreview['outputs'];
};

const getOutputState = ({
    activeStep,
    index,
    isSigned,
}: {
    activeStep?: number;
    index: number;
    isSigned: boolean;
}): ReviewOutputState => {
    if (isSigned) {
        return 'success';
    }

    if (activeStep === undefined) {
        return undefined;
    }

    if (index < activeStep) {
        return 'success';
    }

    if (index === activeStep) {
        return 'active';
    }

    return undefined;
};

const getSummaryState = ({
    activeStep,
    isSigned,
    outputsCount,
}: {
    activeStep?: number;
    isSigned: boolean;
    outputsCount: number;
}): ReviewOutputState => {
    if (isSigned) {
        return 'success';
    }

    return activeStep === outputsCount ? 'active' : undefined;
};

const getStatefulOutputs = ({ activeStep, isSigned, outputs }: GetStatefulOutputsParams) =>
    outputs.map((output: ReviewOutput, index) => ({
        ...output,
        state: getOutputState({
            activeStep,
            index,
            isSigned: isSigned ?? false,
        }),
    }));

export const YieldTransactionReviewOutputList = ({
    accountKey,
    activeStep,
    isSigned = false,
    preview,
}: YieldTransactionReviewOutputListProps) => {
    const { evmTransactionPurpose, outputs, summary } = preview;
    const statefulOutputs = getStatefulOutputs({ activeStep, isSigned, outputs });
    const summaryState = getSummaryState({
        activeStep,
        isSigned,
        outputsCount: statefulOutputs.length,
    });
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(
        activeStep ?? 0,
    );

    return (
        <>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {statefulOutputs.map((output, index) => (
                    <YieldTransactionReviewOutputItem
                        key={`${output.type}-${'value' in output ? output.value : index}`}
                        accountKey={accountKey}
                        evmTransactionPurpose={evmTransactionPurpose}
                        onLayout={event => handleReadListItemHeight(event, index)}
                        reviewOutput={output}
                    />
                ))}
                <YieldTransactionReviewSummaryCard
                    accountKey={accountKey}
                    fee={summary.fee}
                    onLayout={event => handleReadListItemHeight(event, statefulOutputs.length)}
                    outputState={summaryState}
                />
            </VStack>
            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </>
    );
};
