import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey, type ReviewOutputState } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ReviewOutputCard, ReviewOutputItemValues } from '@suite-native/transaction-management';

type ClaimSummaryOutputItemProps = {
    accountKey: AccountKey;
    claimableAmountInWei: string;
    fee: string;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const ClaimSummaryOutputItem = ({
    accountKey,
    claimableAmountInWei,
    fee,
    outputState,
    onLayout,
}: ClaimSummaryOutputItemProps) => {
    const { translate } = useTranslate();

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('earn.claimSummaryOutputItem.title')}
                outputState={outputState}
            >
                <VStack spacing="sp16">
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        value={claimableAmountInWei}
                        translationKey="transactionManagement.review.outputs.summary.amount"
                        isCryptoPrimary
                    />
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        value={fee}
                        translationKey="transactionManagement.review.outputs.summary.maxFee"
                        isCryptoPrimary
                    />
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
