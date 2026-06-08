import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectPrecomposedSendForm,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputSummaryItem,
    SlidingFooterOverlay,
    type StatefulReviewOutput,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectTransactionReviewOutputs,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import {
    type YieldAllowanceReviewFlowType,
    YieldAllowanceReviewOutputItem,
} from './YieldAllowanceReviewOutputItem';

type YieldAllowanceReviewOutputListProps = {
    accountKey: AccountKey;
    flowType: YieldAllowanceReviewFlowType;
    tokenContract: TokenAddress;
};

const getSummaryOutputState = (
    reviewOutputs: StatefulReviewOutput[],
    isTransactionAlreadySigned: boolean,
) => {
    if (isTransactionAlreadySigned) {
        return 'success';
    }

    if (reviewOutputs.length > 0 && reviewOutputs.every(output => output.state === 'success')) {
        return 'active';
    }

    return undefined;
};

const getActiveStep = (
    reviewOutputs: StatefulReviewOutput[],
    summaryState?: 'active' | 'success',
) => {
    if (summaryState === 'active') {
        return reviewOutputs.length;
    }

    const activeOutputIndex = reviewOutputs.findIndex(output => output.state === 'active');

    return Math.max(activeOutputIndex, 0);
};

export const YieldAllowanceReviewOutputList = ({
    accountKey,
    flowType,
    tokenContract,
}: YieldAllowanceReviewOutputListProps) => {
    const formState = useSelector(selectPrecomposedSendForm);
    const precomposedTx = useSelector(selectSendPrecomposedTx);
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const reviewOutputs =
        useSelector((state: TransactionReviewOutputsState) =>
            selectTransactionReviewOutputs(state, accountKey, tokenContract, formState),
        ) ?? [];
    const summaryState = getSummaryOutputState(reviewOutputs, isTransactionAlreadySigned);
    const activeStep = getActiveStep(reviewOutputs, summaryState);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!accountSymbol) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="transactionManagement.review.outputs.noAccount" />}
            />
        );
    }

    if (!isFinalPrecomposedTransaction(precomposedTx)) {
        return null;
    }

    return (
        <>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {reviewOutputs.map((output, index) => (
                    <YieldAllowanceReviewOutputItem
                        key={`${output.type}-${output.value}-${index}`}
                        flowType={flowType}
                        reviewOutput={output}
                        onLayout={event => handleReadListItemHeight(event, index)}
                    />
                ))}
                <ReviewOutputSummaryItem
                    accountKey={accountKey}
                    summaryOutput={{
                        state: summaryState,
                        totalSpent: precomposedTx.totalSpent,
                        fee: precomposedTx.fee,
                    }}
                    symbol={accountSymbol}
                    tokenContract={tokenContract}
                    onLayout={event => handleReadListItemHeight(event, reviewOutputs.length)}
                    flowType={flowType}
                />
            </VStack>
            {!isTransactionAlreadySigned && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
