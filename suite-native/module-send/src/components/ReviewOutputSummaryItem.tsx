import { useSelector } from 'react-redux';
import { LayoutChangeEvent, View } from 'react-native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { selectReviewSummaryOutput } from '../selectors';
import { ReviewOutputItemValues } from './ReviewOutputItemValues';
import { ReviewOutputCard } from './ReviewOutputCard';

type ReviewOutputSummaryItemProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const ReviewOutputSummaryItem = ({
    accountKey,
    networkSymbol,
    onLayout,
}: ReviewOutputSummaryItemProps) => {
    const { translate } = useTranslate();
    const summaryOutput = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectReviewSummaryOutput(state, accountKey),
    );

    if (!summaryOutput) return null;

    const { state, totalSpent, fee } = summaryOutput;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('moduleSend.review.outputs.total.label')}
                outputState={state}
            >
                <VStack spacing="medium">
                    <ReviewOutputItemValues
                        value={totalSpent}
                        networkSymbol={networkSymbol}
                        translationKey="moduleSend.review.outputs.total.amount"
                    />
                    <ReviewOutputItemValues
                        value={fee}
                        networkSymbol={networkSymbol}
                        translationKey="moduleSend.review.outputs.total.fee"
                    />
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
