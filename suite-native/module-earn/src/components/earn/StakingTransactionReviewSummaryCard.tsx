import { type LayoutChangeEvent, View } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TransactionReviewOutputState } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    TransactionReviewOutputCard,
    TransactionReviewOutputItemValues,
} from '@suite-native/transaction-review';

import { type EarnFormDraftPrefix } from '../../types';

interface StakingTransactionReviewSummaryCardProps {
    accountKey: AccountKey;
    stakeType: EarnFormDraftPrefix;
    amount: string;
    fee: string;
    outputState: TransactionReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
}

export const StakingTransactionReviewSummaryCard = ({
    accountKey,
    stakeType,
    amount,
    fee,
    outputState,
    onLayout,
}: StakingTransactionReviewSummaryCardProps) => {
    const { translate } = useTranslate();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    // The device omits the amount from the Ethereum claim and the Solana unstake summaries;
    // hide the row to match it.
    const isAmountHiddenOnDevice =
        !!symbol &&
        ((stakeType === 'claim' && isSupportedEthStakingNetworkSymbol(symbol)) ||
            (stakeType === 'unstake' && isSupportedSolStakingNetworkSymbol(symbol)));

    return (
        <View onLayout={onLayout}>
            <TransactionReviewOutputCard
                title={translate('earn.earnSummaryOutputItem.title')}
                outputState={outputState}
            >
                <VStack spacing="sp16">
                    {!isAmountHiddenOnDevice && (
                        <TransactionReviewOutputItemValues
                            accountKey={accountKey}
                            value={amount}
                            translationKey="transactionManagement.review.outputs.summary.amount"
                        />
                    )}
                    <TransactionReviewOutputItemValues
                        accountKey={accountKey}
                        value={fee}
                        translationKey="transactionManagement.review.outputs.summary.maxFee"
                    />
                </VStack>
            </TransactionReviewOutputCard>
        </View>
    );
};
