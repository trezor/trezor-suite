import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectIsTransactionReviewInProgress,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { UnstakeOutputItem } from './UnstakeOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';

const NUMBER_OF_STEPS = 2;

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.UnstakeTransactionDataReview>;

type UnstakeTransactionDataReviewStepListProps = {
    onSign: () => Promise<boolean>;
};

export const UnstakeTransactionDataReviewStepList = ({
    onSign,
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

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [stepIndex, setStepIndex] = useState(0);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);

    if (!accountSymbol) {
        return null;
    }

    const isLastStep = stepIndex === NUMBER_OF_STEPS - 1;
    const areAllStepsDone = isLastStep || isTransactionReviewInProgress;

    const handleNextStep = async () => {
        if (stepIndex === NUMBER_OF_STEPS - 2) {
            const didSign = await onSign();

            if (!didSign) {
                return;
            }
        }

        setStepIndex(prevStepIndex => prevStepIndex + 1);
    };

    const amountInBaseUnits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        symbol: accountSymbol,
    }).toString();

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <UnstakeOutputItem
                    symbol={accountSymbol}
                    outputState={isTransactionAlreadySigned ? 'success' : 'active'}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                />

                <EarnSummaryOutputItem
                    accountKey={accountKey}
                    amount={amountInBaseUnits}
                    fee={summaryOutput?.fee ?? selectedPrecomposed?.fee ?? '0'}
                    outputState={summaryOutput?.state ?? (isLastStep ? 'active' : undefined)}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                />
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
