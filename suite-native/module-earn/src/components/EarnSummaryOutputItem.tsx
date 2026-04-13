import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey, type ReviewOutputState } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ReviewOutputCard, ReviewOutputItemValues } from '@suite-native/transaction-management';

type EarnSummaryOutputItemProps = {
    accountKey: AccountKey;
    amount: string;
    fee: string;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const EarnSummaryOutputItem = ({
    accountKey,
    amount,
    fee,
    outputState,
    onLayout,
}: EarnSummaryOutputItemProps) => {
    const { translate } = useTranslate();

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('earn.earnSummaryOutputItem.title')}
                outputState={outputState}
            >
                <VStack spacing="sp16">
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        value={amount}
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
