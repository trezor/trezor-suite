import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StakingPromoList } from '../staking/StakingPromoList';
import { YieldPromoList } from '../yield/YieldPromoList';

export const EarnPromoList = () => (
    <>
        <Text variant="headline-sm">
            <Translation id="earn.earnScreen.otherOpportunities" />
        </Text>

        <StakingPromoList />
        <YieldPromoList />
    </>
);
