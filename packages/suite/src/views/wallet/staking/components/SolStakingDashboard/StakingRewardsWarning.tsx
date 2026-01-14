import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

export const StakingRewardsWarning = () => (
    <Banner
        intent="warning"
        icon="warning"
        description={<Translation id="TR_SOL_STAKING_REWARD_WARNING" />}
    />
);
