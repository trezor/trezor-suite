import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

export const StakingRewardsWarning = () => (
    <Banner variant="warning" icon="warning" iconSize="medium">
        <Translation id="TR_SOL_STAKING_REWARD_WARNING" />
    </Banner>
);
