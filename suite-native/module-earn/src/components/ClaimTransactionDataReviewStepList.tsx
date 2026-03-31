import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDecimals } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
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
    selectIsTransactionReviewInProgress,
    selectReviewSummaryOutput,
    useActiveStepOffset,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { ClaimOutputItem } from './ClaimOutputItem';
import { ClaimSummaryOutputItem } from './ClaimSummaryOutputItem';
import { useHandleOnClaimTransactionReview } from '../hooks/useHandleOnClaimTransactionReview';

const NUMBER_OF_STEPS = 2;

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>;

type ClaimTransactionDataReviewStepListProps = {
    onTransactionSubmitted: (txid: string) => void;
};

export const ClaimTransactionDataReviewStepList = ({
    onTransactionSubmitted,
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

    const [stepIndex, setStepIndex] = useState(0);

    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);

    const handleOnClaimTransactionReview = useHandleOnClaimTransactionReview({
        accountKey,
        onTransactionSubmitted,
    });

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1 || isTransactionReviewInProgress;

    const handleNextStep = () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            handleOnClaimTransactionReview();
        }
    };

    const networkDecimals = accountSymbol ? (getNetworkDecimals(accountSymbol) ?? 18) : 18;
    const claimableAmountInWei = new BigNumber(claimableAmount || '0')
        .times(new BigNumber(10).pow(networkDecimals))
        .toFixed(0);

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {!!accountSymbol && (
                    <ClaimOutputItem
                        symbol={accountSymbol}
                        outputState={stepIndex > 0 ? 'success' : 'active'}
                        onLayout={event => handleReadListItemHeight(event, 0)}
                    />
                )}

                {!!accountSymbol && (
                    <ClaimSummaryOutputItem
                        accountKey={accountKey}
                        claimableAmountInWei={claimableAmountInWei}
                        fee={summaryOutput?.fee ?? '0'}
                        outputState={summaryOutput?.state}
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
