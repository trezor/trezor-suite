import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { EarnStakeOutputItem } from './EarnStakeOutputItem';
import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';

const NUMBER_OF_STEPS = 2;

type EarnTransactionDataReviewStepListProps = {
    accountKey: AccountKey;
    amount: string;
    accountSymbol: NetworkSymbol;
    onTransactionSubmitted: (txid: string) => void;
};

export const EarnTransactionDataReviewStepList = ({
    accountKey,
    amount,
    accountSymbol,
    onTransactionSubmitted,
}: EarnTransactionDataReviewStepListProps) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'stake', accountKey),
    );

    const [stepIndex, setStepIndex] = useState(0);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);
    const handleOnEarnTransactionReview = useHandleOnEarnTransactionReview({
        accountKey,
        amount,
        onTransactionSubmitted,
    });

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1 || isTransactionReviewInProgress;

    const handleNextStep = () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            handleOnEarnTransactionReview();
        }
    };

    const networkDecimals = getNetworkDecimals(accountSymbol) ?? 18;
    const amountInWei = new BigNumber(amount)
        .times(new BigNumber(10).pow(networkDecimals))
        .toFixed(0);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <EarnStakeOutputItem
                    symbol={accountSymbol}
                    outputState={stepIndex > 0 ? 'success' : 'active'}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                />

                <EarnSummaryOutputItem
                    accountKey={accountKey}
                    amount={amountInWei}
                    fee={summaryOutput?.fee ?? '0'}
                    outputState={summaryOutput?.state}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                />
            </VStack>
            {!areAllStepsDone && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button onPress={handleNextStep} testID="@earn/address-review-continue">
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
