import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import { ethToWei } from '@suite-native/staking';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { UnstakeOutputItem } from './UnstakeOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useHandleOnUnstakeTransactionReview } from '../hooks/useHandleOnUnstakeTransactionReview';

const NUMBER_OF_STEPS = 2;

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.UnstakeTransactionDataReview>;

type UnstakeTransactionDataReviewStepListProps = {
    onTransactionSubmitted: (txid: string) => void;
};

export const UnstakeTransactionDataReviewStepList = ({
    onTransactionSubmitted,
}: UnstakeTransactionDataReviewStepListProps) => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount } = route.params;

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'unstake', accountKey),
    );

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'unstake', accountKey),
    );

    const selectedPrecomposed = useEarnSelectedPrecomposedTransaction('unstake', accountKey);

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [stepIndex, setStepIndex] = useState(0);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);
    const handleOnUnstakeTransactionReview = useHandleOnUnstakeTransactionReview({
        accountKey,
        onTransactionSubmitted,
    });

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1 || isTransactionReviewInProgress;

    const handleNextStep = () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            handleOnUnstakeTransactionReview();
        }
    };

    const amountInWei = ethToWei(amount);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {!!accountSymbol && (
                    <>
                        <UnstakeOutputItem
                            symbol={accountSymbol}
                            outputState={stepIndex > 0 ? 'success' : 'active'}
                            onLayout={event => handleReadListItemHeight(event, 0)}
                        />
                        <EarnSummaryOutputItem
                            accountKey={accountKey}
                            amount={amountInWei}
                            fee={summaryOutput?.fee ?? selectedPrecomposed?.fee ?? '0'}
                            outputState={summaryOutput?.state}
                            onLayout={event => handleReadListItemHeight(event, 1)}
                        />
                    </>
                )}
            </VStack>
            {!areAllStepsDone && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button onPress={handleNextStep} testID="@earn/unstake-review-continue">
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
