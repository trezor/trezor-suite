import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDecimals } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
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
    selectIsTransactionReviewInProgress,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { ClaimOutputItem } from './ClaimOutputItem';
import { ClaimSummaryOutputItem } from './ClaimSummaryOutputItem';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';

const NUMBER_OF_STEPS = 2;

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>;

type ClaimTransactionDataReviewStepListProps = {
    onSign: () => Promise<boolean>;
};

export const ClaimTransactionDataReviewStepList = ({
    onSign,
}: ClaimTransactionDataReviewStepListProps) => {
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'claim', accountKey),
    );

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

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const [stepIndex, setStepIndex] = useState(0);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);

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
                        outputState={isTransactionAlreadySigned ? 'success' : 'active'}
                        onLayout={event => handleReadListItemHeight(event, 0)}
                    />
                )}

                {!!accountSymbol && (
                    <ClaimSummaryOutputItem
                        accountKey={accountKey}
                        claimableAmountInWei={claimableAmountInWei}
                        fee={summaryOutput?.fee ?? precomposedTransaction?.fee ?? '0'}
                        outputState={summaryOutput?.state ?? (isLastStep ? 'active' : undefined)}
                        onLayout={event => handleReadListItemHeight(event, 1)}
                    />
                )}
            </VStack>
            {!areAllStepsDone && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button onPress={handleNextStep} testID="@earn/claim-review-continue">
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
