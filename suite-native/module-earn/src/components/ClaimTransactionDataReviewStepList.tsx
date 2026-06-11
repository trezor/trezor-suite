import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDecimals } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { VStack } from '@suite-native/atoms';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import {
    selectClaimableAmountByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import {
    LIST_VERTICAL_SPACING,
    SlidingFooterOverlay,
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { ClaimOutputItem } from './ClaimOutputItem';
import { ClaimSummaryOutputItem } from './ClaimSummaryOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>;

export const ClaimTransactionDataReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;

    const isSigned = useSelector(selectIsTransactionAlreadySigned);

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'claim', accountKey),
    );

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const claimableAmount = useNativeStakingSelector(state =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('claim', accountKey);

    // The summary card only unlocks once every device output has been confirmed, which is exactly when
    // selectReviewSummaryOutput exposes a state.
    const isSummaryActive = !!summaryOutput?.state;
    const activeStep = isSummaryActive ? 1 : 0;

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    const networkDecimals = accountSymbol ? (getNetworkDecimals(accountSymbol) ?? 18) : 18;
    const isSolanaClaim = !!accountSymbol && isSupportedSolStakingNetworkSymbol(accountSymbol);

    // Solana: show composed lamports (totalSpent − fee)
    // Ethereum: show claimable amount (calldata-only)
    const claimableAmountInWei =
        isSolanaClaim && precomposedTransaction
            ? new BigNumber(precomposedTransaction.totalSpent)
                  .minus(precomposedTransaction.fee)
                  .toFixed(0)
            : new BigNumber(claimableAmount || '0')
                  .times(new BigNumber(10).pow(networkDecimals))
                  .toFixed(0);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {!!accountSymbol && (
                    <ClaimOutputItem
                        symbol={accountSymbol}
                        outputState={isSigned || isSummaryActive ? 'success' : 'active'}
                        onLayout={event => handleReadListItemHeight(event, 0)}
                    />
                )}

                {!!accountSymbol && (
                    <ClaimSummaryOutputItem
                        accountKey={accountKey}
                        claimableAmountInWei={claimableAmountInWei}
                        fee={summaryOutput?.fee ?? precomposedTransaction?.fee ?? '0'}
                        outputState={summaryOutput?.state}
                        onLayout={event => handleReadListItemHeight(event, 1)}
                    />
                )}
            </VStack>
            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </View>
    );
};
