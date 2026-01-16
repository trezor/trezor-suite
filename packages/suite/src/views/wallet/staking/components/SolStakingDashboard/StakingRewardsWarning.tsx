import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

export const StakingRewardsWarning = () => (
    <Banner
        intent="warning"
        icon="warning"
        description={<Translation id="TR_SOL_STAKING_REWARD_WARNING" />}
    />
);
