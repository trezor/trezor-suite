import { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
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
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';

const NUMBER_OF_STEPS = 2;

type EarnTransactionDataReviewStepListProps = {
    accountKey: AccountKey;
    amount: string;
    accountSymbol: NetworkSymbol;
    onSign: () => Promise<boolean>;
};

export const EarnTransactionDataReviewStepList = ({
    accountKey,
    amount,
    accountSymbol,
    onSign,
}: EarnTransactionDataReviewStepListProps) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'stake', accountKey),
    );

    const selectedPrecomposed = useEarnSelectedPrecomposedTransaction('stake', accountKey);

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

    const amountInBaseUnits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        symbol: accountSymbol,
    }).toString();

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
                    amount={amountInBaseUnits}
                    fee={summaryOutput?.fee ?? selectedPrecomposed?.fee ?? '0'}
                    outputState={summaryOutput?.state ?? (isLastStep ? 'active' : undefined)}
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
