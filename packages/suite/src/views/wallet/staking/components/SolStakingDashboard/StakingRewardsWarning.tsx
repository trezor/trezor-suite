import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

export const StakingRewardsWarning = () => (
    <Banner
        intent="warning"
        icon={WarningIcon}
        description={<Translation id="TR_SOL_STAKING_REWARD_WARNING" />}
    />
);
