import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormDraftWithSendKeyPrefix,
    type FormState,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { ExchangeFlowType } from '@suite-native/navigation';

import { ReviewOutputItem } from './ReviewOutputItem';
import { ReviewOutputSummaryItem } from './ReviewOutputSummaryItem';
import { LIST_VERTICAL_SPACING, useActiveStepOffset } from '../../hooks';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputs,
    selectTransactionReviewOutputsFromDraft,
} from '../../selectors';
import { SlidingFooterOverlay } from '../SlidingFooterOverlay';

export type ReviewOutputItemListProps = {
    prefix: FormDraftWithSendKeyPrefix;
    accountKey: AccountKey;
    formState?: FormState;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
};

export const ReviewOutputItemList = ({
    prefix,
    accountKey,
    formState,
    tokenContract,
    flowType,
}: ReviewOutputItemListProps) => {
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewActiveStepIndex(state, prefix, accountKey, tokenContract, formState),
    );
    const reviewOutputs =
        useSelector((state: TransactionReviewOutputsState) =>
            formState
                ? selectTransactionReviewOutputs(state, accountKey, tokenContract, formState)
                : selectTransactionReviewOutputsFromDraft(state, prefix, accountKey, tokenContract),
        ) || undefined;
    const summaryOutput =
        useSelector((state: TransactionReviewOutputsState) =>
            selectReviewSummaryOutput(state, prefix, accountKey, tokenContract, formState),
        ) || undefined;
    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isTron = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, accountKey)?.networkType === 'tron',
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
                            flowType={flowType}
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
            {!isTransactionAlreadySigned && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />
            )}
        </>
    );
};
