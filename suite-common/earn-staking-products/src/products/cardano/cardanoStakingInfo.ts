import {
    type CardanoDrep,
    type StakingAccount,
    type StakingAmount,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';

export type ParsedCardanoStakingInfo = {
    poolId: string | null;
    rewards: StakingAmount;
    drep: CardanoDrep | null;
};

// Only a registered stake key delegates, earns and votes. Malformed rewards leave the
// account without a Cardano position instead of failing the sync of the whole account.
export const parseCardanoStakingInfo = ({
    misc,
}: StakingAccount): ParsedCardanoStakingInfo | null => {
    const staking = misc?.staking;

    if (!staking?.isActive) return null;

    const rewards = stakingAmountSchema.safeParse(staking.rewards);

    if (!rewards.success) return null;

    return {
        poolId: staking.poolId || null,
        rewards: rewards.data,
        drep: staking.drep?.drep_id
            ? { id: staking.drep.drep_id, hasScript: staking.drep.has_script }
            : null,
    };
};
