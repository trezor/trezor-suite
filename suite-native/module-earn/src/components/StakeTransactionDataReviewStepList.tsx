import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { VStack } from '@suite-native/atoms';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { StakeOutputItem } from './StakeOutputItem';
import { EarnSummaryOutputItem } from './EarnSummaryOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';
import { getEarnPendingAmountInBaseUnits } from '../utils/getEarnPendingAmountInBaseUnits';

type StakeTransactionDataReviewStepListProps = {
    accountKey: AccountKey;
    amount: string;
    accountSymbol: NetworkSymbol;
};

export const StakeTransactionDataReviewStepList = ({
    accountKey,
    amount,
    accountSymbol,
}: StakeTransactionDataReviewStepListProps) => {
    const isSigned = useSelector(selectIsTransactionAlreadySigned);

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'stake', accountKey),
    );

    const selectedPrecomposed = useEarnSelectedPrecomposedTransaction('stake', accountKey);

    // The Trezor reveals the staking step first, then the summary. The summary card only unlocks once every
    // device output has been confirmed, which is exactly when selectReviewSummaryOutput exposes a state.
    const isSummaryActive = !!summaryOutput?.state;
    const activeStep = isSummaryActive ? 1 : 0;

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    const isSolanaStake = isSupportedSolStakingNetworkSymbol(accountSymbol);
    const displayedAmountInBaseUnits = getEarnPendingAmountInBaseUnits({
        fallbackAmountInBaseUnits: getAmountInBaseUnits(amount, accountSymbol),
        isSolanaStaking: isSolanaStake,
        precomposedTransaction: selectedPrecomposed,
    });

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <StakeOutputItem
                    symbol={accountSymbol}
                    outputState={isSigned || isSummaryActive ? 'success' : 'active'}
                    onLayout={event => handleReadListItemHeight(event, 0)}
                />

                <EarnSummaryOutputItem
                    accountKey={accountKey}
                    stakeType="stake"
                    amount={displayedAmountInBaseUnits}
                    fee={summaryOutput?.fee ?? selectedPrecomposed?.fee ?? '0'}
                    outputState={summaryOutput?.state}
                    onLayout={event => handleReadListItemHeight(event, 1)}
                />
            </VStack>
            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </View>
    );
};
