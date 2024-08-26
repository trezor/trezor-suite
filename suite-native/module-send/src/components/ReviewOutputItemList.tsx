import { useSelector } from 'react-redux';
import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { ErrorMessage, VStack } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    SendRootState,
    selectAccountByKey,
    selectSendSignedTx,
} from '@suite-common/wallet-core';
import { nativeSpacings } from '@trezor/theme';

import { ReviewOutputItem } from './ReviewOutputItem';
import {
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputs,
} from '../selectors';
import { ReviewOutputSummaryItem } from './ReviewOutputSummaryItem';
import { SlidingFooterOverlay } from './SlidingFooterOverlay';

type ReviewOutputItemListProps = { accountKey: AccountKey };

const INITIAL_OFFSET = 85;
const LIST_VERTICAL_SPACING = nativeSpacings.medium;

export const ReviewOutputItemList = ({ accountKey }: ReviewOutputItemListProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const reviewOutputs = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectTransactionReviewOutputs(state, accountKey),
    );
    const signedTransaction = useSelector(selectSendSignedTx);

    const activeStep = useSelector((state: AccountsRootState & DeviceRootState & SendRootState) =>
        selectTransactionReviewActiveStepIndex(state, accountKey),
    );

    const [childHeights, setChildHeights] = useState<number[]>([]);

    const handleReadListItemHeight = (event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;
        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + LIST_VERTICAL_SPACING;

            return newHeights;
        });
    };

    const isLayoutReady = childHeights.length === (reviewOutputs?.length ?? 0) + 1;

    if (!account) return <ErrorMessage errorMessage="Account not found." />;

    return (
        <>
            {reviewOutputs && (
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    {reviewOutputs?.map((output, index) => (
                        <ReviewOutputItem
                            networkSymbol={account.symbol}
                            key={output.value}
                            reviewOutput={output}
                            onLayout={event => handleReadListItemHeight(event, index)}
                        />
                    ))}
                    <ReviewOutputSummaryItem
                        accountKey={accountKey}
                        networkSymbol={account.symbol}
                        onLayout={event => handleReadListItemHeight(event, reviewOutputs.length)}
                    />
                </VStack>
            )}
            {!signedTransaction && (
                <SlidingFooterOverlay
                    isLayoutReady={isLayoutReady}
                    currentStepIndex={activeStep}
                    stepHeights={childHeights}
                    initialOffset={INITIAL_OFFSET}
                />
            )}
        </>
    );
};
