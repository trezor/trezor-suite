import { type AccountKey, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import type { StakingEarnItem, YieldClaimSummary, YieldEarnItem } from '../types';
import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
import { EarnDepositsCard } from './EarnDepositsCard';

type EarnScreenListHeaderProps = {
    cardanoStakingAccountKey?: AccountKey;
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: YieldEarnItem[];
    stablecoinYieldClaimSummaries: YieldClaimSummary[];
    stablecoinYieldTotalFiatClaimableAmount: BaseCurrencyAmount | null;
    isStablecoinYieldLoading: boolean;
    isStablecoinYieldClaimSummariesLoading: boolean;
};

export const EarnScreenListHeader = ({
    cardanoStakingAccountKey,
    stakingActiveItems,
    stablecoinYieldActiveItems,
    stablecoinYieldClaimSummaries,
    stablecoinYieldTotalFiatClaimableAmount,
    isStablecoinYieldLoading,
    isStablecoinYieldClaimSummariesLoading,
}: EarnScreenListHeaderProps) => {
    if (
        stakingActiveItems.length === 0 &&
        stablecoinYieldActiveItems.length === 0 &&
        stablecoinYieldClaimSummaries.length === 0
    ) {
        return null;
    }

    return (
        <VStack spacing="sp24" marginBottom="sp16">
            {cardanoStakingAccountKey != null && (
                <CardanoStakingInfoBanner accountKey={cardanoStakingAccountKey} />
            )}
            <EarnDepositsCard
                isStablecoinYieldLoading={isStablecoinYieldLoading}
                isStablecoinYieldClaimSummariesLoading={isStablecoinYieldClaimSummariesLoading}
                stakingActiveItems={stakingActiveItems}
                stablecoinYieldActiveItems={stablecoinYieldActiveItems}
                stablecoinYieldClaimSummaries={stablecoinYieldClaimSummaries}
                stablecoinYieldTotalFiatClaimableAmount={stablecoinYieldTotalFiatClaimableAmount}
            />
            <Text variant="headline-sm">
                <Translation id="earn.earnScreen.otherOpportunities" />
            </Text>
        </VStack>
    );
};
