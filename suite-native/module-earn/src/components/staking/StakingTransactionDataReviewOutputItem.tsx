import { type LayoutChangeEvent, View } from 'react-native';

import { isSupportedEthStakingNetworkSymbol } from '@suite-common/staking';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ReviewOutputState } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ReviewOutputCard } from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../../types';

const titleTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnStakeOutputItem.title',
    unstake: 'earn.earnUnstakeOutputItem.title',
    claim: 'earn.claimOutputItem.title',
};

const descriptionTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnStakeOutputItem.description',
    unstake: 'earn.earnUnstakeOutputItem.description',
    claim: 'earn.claimOutputItem.description',
};

const everstakeDescriptionTranslationId: Record<
    Extract<EarnFormDraftPrefix, 'unstake' | 'claim'>,
    TxKeyPath
> = {
    unstake: 'earn.earnUnstakeOutputItem.descriptionEverstake',
    claim: 'earn.claimOutputItem.descriptionEverstake',
};

interface StakingTransactionDataReviewOutputItemProps {
    stakeType: EarnFormDraftPrefix;
    symbol: NetworkSymbol;
    outputState: ReviewOutputState;
    onLayout: (event: LayoutChangeEvent) => void;
}

export const StakingTransactionDataReviewOutputItem = ({
    stakeType,
    symbol,
    outputState,
    onLayout,
}: StakingTransactionDataReviewOutputItemProps) => {
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const isEverstakeStaking = stakeType !== 'stake' && isSupportedEthStakingNetworkSymbol(symbol);

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={<Translation id={titleTranslationId[stakeType]} />}
                outputState={outputState}
            >
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id={
                            isEverstakeStaking
                                ? everstakeDescriptionTranslationId[stakeType]
                                : descriptionTranslationId[stakeType]
                        }
                        values={{ displaySymbol }}
                    />
                </Text>
            </ReviewOutputCard>
        </View>
    );
};
