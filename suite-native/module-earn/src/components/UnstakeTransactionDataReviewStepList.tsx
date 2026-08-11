import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { UnstakeOutputItem } from './UnstakeOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.UnstakeTransactionDataReview>;

export const UnstakeTransactionDataReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount } = route.params;

    const isSigned = useSelector(selectIsTransactionAlreadySigned);

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'unstake', accountKey),
    );

    const selectedPrecomposed = useEarnSelectedPrecomposedTransaction('unstake', accountKey);

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    // The summary card only unlocks once every device output has been confirmed, which is exactly when
    // selectReviewSummaryOutput exposes a state.
    const isSummaryActive = !!summaryOutput?.state;
    const activeStep = isSummaryActive ? 1 : 0;

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    if (!accountSymbol) {
        return null;
    }

    const amountInBaseUnits = getAmountInBaseUnits(amount, accountSymbol);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <UnstakeOutputItem
                    symbol={accountSymbol}
                    outputState={isSigned || isSummaryActive ? 'success' : 'active'}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                />

                <EarnSummaryOutputItem
                    accountKey={accountKey}
                    stakeType="unstake"
                    amount={amountInBaseUnits}
                    fee={summaryOutput?.fee ?? selectedPrecomposed?.fee ?? '0'}
                    outputState={summaryOutput?.state}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                />
            </VStack>
            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </View>
    );
};
