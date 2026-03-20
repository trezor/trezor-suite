import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
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

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.EarnTransactionDataReview>;

type EarnTransactionDataReviewStepListProps = {
    onTransactionSubmitted: (txid: string) => void;
};

export const EarnTransactionDataReviewStepList = ({
    onTransactionSubmitted,
}: EarnTransactionDataReviewStepListProps) => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount } = route.params;

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'stake', accountKey),
    );

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
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

    const amountInWei = new BigNumber(amount).times(new BigNumber(10).pow(18)).toFixed(0);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {!!accountSymbol && (
                    <EarnStakeOutputItem
                        symbol={accountSymbol}
                        outputState={stepIndex > 0 ? 'success' : 'active'}
                        onLayout={event => handleReadListItemHeight(event, 0)}
                    />
                )}

                {!!accountSymbol && (
                    <EarnSummaryOutputItem
                        accountKey={accountKey}
                        amount={amountInWei}
                        fee={summaryOutput?.fee ?? '0'}
                        outputState={summaryOutput?.state}
                        onLayout={event => handleReadListItemHeight(event, 1)}
                    />
                )}
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
