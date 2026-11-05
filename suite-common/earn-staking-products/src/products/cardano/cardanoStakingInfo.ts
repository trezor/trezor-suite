import {
    type CardanoDrep,
    type StakingAccount,
    type StakingAmount,
    cardanoPoolIdSchema,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';

export type ParsedCardanoStakingInfo = {
    balance: StakingAmount;
    poolId: string | null;
    rewards: StakingAmount;
    drep: CardanoDrep | null;
};

export const isCardanoStakeKeyRegistered = ({ misc }: StakingAccount) =>
    misc?.staking?.isActive === true;

export const parseCardanoAccountBalance = ({ balance }: StakingAccount): StakingAmount | null => {
    const parsedBalance = stakingAmountSchema.safeParse(balance);

    return parsedBalance.success ? parsedBalance.data : null;
};

// Only a registered stake key delegates, earns and votes. A malformed balance, rewards or pool id
// leave the account without a Cardano position instead of failing the sync of the whole account or
// attributing the stake to the wrong product. The pool id is lowercased, as bech32 allows.
export const parseCardanoStakingInfo = (
    account: StakingAccount,
): ParsedCardanoStakingInfo | null => {
    const staking = account.misc?.staking;

    if (!staking?.isActive) return null;

    const balance = parseCardanoAccountBalance(account);
    const rewards = stakingAmountSchema.safeParse(staking.rewards);
    const poolId = staking.poolId
        ? cardanoPoolIdSchema.safeParse(staking.poolId.toLowerCase())
        : null;

    if (balance === null || !rewards.success || poolId?.success === false) return null;

    return {
        balance,
        poolId: poolId?.data ?? null,
        rewards: rewards.data,
        drep: staking.drep?.drep_id
            ? { id: staking.drep.drep_id, hasScript: staking.drep.has_script }
            : null,
    };
};
