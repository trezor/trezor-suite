import { useSelector } from 'react-redux';
import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { ErrorMessage, VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    SendRootState,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { nativeSpacings } from '@trezor/theme';

import { ReviewOutputItem } from './ReviewOutputItem';
import {
    selectIsTransactionAlreadySigned,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputs,
} from '../selectors';
import { ReviewOutputSummaryItem } from './ReviewOutputSummaryItem';
import { SlidingFooterOverlay } from './SlidingFooterOverlay';

type ReviewOutputItemListProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

const INITIAL_OFFSET = 85;
const LIST_VERTICAL_SPACING = nativeSpacings.sp16;

export const ReviewOutputItemList = ({ accountKey, tokenContract }: ReviewOutputItemListProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const reviewOutputs = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectTransactionReviewOutputs(state, accountKey, tokenContract),
    );
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: AccountsRootState & DeviceRootState & SendRootState) =>
        selectTransactionReviewActiveStepIndex(state, accountKey, tokenContract),
    );

    const [childHeights, setChildHeights] = useState<number[]>([]);

    const handleReadListItemHeight = (event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;
        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + 2 * LIST_VERTICAL_SPACING;

            return newHeights;
        });
    };

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
                        tokenContract={tokenContract}
                        onLayout={event => handleReadListItemHeight(event, reviewOutputs.length)}
                    />
                </VStack>
            )}
            {!isTransactionAlreadySigned && (
                <SlidingFooterOverlay
                    currentStepIndex={activeStep}
                    stepHeights={childHeights}
                    initialOffset={INITIAL_OFFSET}
                />
            )}
        </>
    );
};
