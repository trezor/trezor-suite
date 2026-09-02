import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { StakingTransactionDataReviewOutputItem } from './StakingTransactionDataReviewOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../../hooks/earn/useEarnSelectedPrecomposedTransaction';
import { EarnSummaryOutputItem } from '../earn/EarnSummaryOutputItem';

interface StakingTransactionDataReviewStepListProps {
    account: Account;
    stakeType: 'stake' | 'unstake' | 'claim';
    amountInBaseUnits: string;
}

export const StakingTransactionDataReviewStepList = ({
    account,
    stakeType,
    amountInBaseUnits,
}: StakingTransactionDataReviewStepListProps) => {
    const isSigned = useSelector(selectIsTransactionAlreadySigned);

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, stakeType, account.key),
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, account.key);

    // The Trezor reveals the staking step first, then the summary. The summary card only unlocks once every
    // device output has been confirmed, which is exactly when selectReviewSummaryOutput exposes a state.
    const isSummaryActive = !!summaryOutput?.state;
    const activeStep = isSummaryActive ? 1 : 0;

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <StakingTransactionDataReviewOutputItem
                    stakeType={stakeType}
                    symbol={account.symbol}
                    outputState={isSigned || isSummaryActive ? 'success' : 'active'}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                />

                <EarnSummaryOutputItem
                    accountKey={account.key}
                    stakeType={stakeType}
                    amount={amountInBaseUnits}
                    fee={summaryOutput?.fee ?? precomposedTransaction?.fee ?? '0'}
                    outputState={summaryOutput?.state}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                />
            </VStack>

            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </View>
    );
};
