import { type AccountKey } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { type StablecoinYieldEarnItem, type StakingEarnItem } from '../types';
import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
import { EarnDepositsCard } from './EarnDepositsCard';

type EarnScreenListHeaderProps = {
    cardanoStakingAccountKey?: AccountKey;
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: StablecoinYieldEarnItem[];
};

export const EarnScreenListHeader = ({
    cardanoStakingAccountKey,
    stakingActiveItems,
    stablecoinYieldActiveItems,
}: EarnScreenListHeaderProps) => {
    if (stakingActiveItems.length === 0 && stablecoinYieldActiveItems.length === 0) {
        return null;
    }

    return (
        <VStack spacing="sp24" marginBottom="sp16">
            {cardanoStakingAccountKey != null && (
                <CardanoStakingInfoBanner accountKey={cardanoStakingAccountKey} />
            )}
            <EarnDepositsCard
                stakingActiveItems={stakingActiveItems}
                stablecoinYieldActiveItems={stablecoinYieldActiveItems}
            />
            <Text variant="headline-sm">
                <Translation id="earn.earnScreen.otherOpportunities" />
            </Text>
        </VStack>
    );
};
