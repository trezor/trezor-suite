import { type LayoutChangeEvent, View } from 'react-native';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type ReviewOutputState } from '@suite-common/wallet-types';
import {
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ReviewOutputCard, ReviewOutputItemValues } from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../types';

type EarnSummaryOutputItemProps = {
    accountKey: AccountKey;
    stakeType: EarnFormDraftPrefix;
    amount: string;
    fee: string;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const EarnSummaryOutputItem = ({
    accountKey,
    stakeType,
    amount,
    fee,
    outputState,
    onLayout,
}: EarnSummaryOutputItemProps) => {
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
            <ReviewOutputCard
                title={translate('earn.earnSummaryOutputItem.title')}
                outputState={outputState}
            >
                <VStack spacing="sp16">
                    {!isAmountHiddenOnDevice && (
                        <ReviewOutputItemValues
                            accountKey={accountKey}
                            value={amount}
                            translationKey="transactionManagement.review.outputs.summary.amount"
                        />
                    )}
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        value={fee}
                        translationKey="transactionManagement.review.outputs.summary.maxFee"
                    />
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
