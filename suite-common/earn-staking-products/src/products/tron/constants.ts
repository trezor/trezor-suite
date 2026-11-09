import { type StakingOperation, stakingAmountSchema } from '@suite-common/earn-staking-common';

export const TRON_RESOURCES = ['energy', 'bandwidth'] as const;

// TRON_STAKING_RESERVE, which the legacy freeze form keeps on Max.
export const TRON_STAKE_RESERVE = stakingAmountSchema.parse('500000');

export const TRON_STAKING_OPERATIONS_BY_TRON_CONTRACT_TYPE: Partial<
    Record<string, StakingOperation>
> = {
    FreezeBalanceContract: 'stake',
    FreezeBalanceV2Contract: 'stake',
    UnfreezeBalanceContract: 'unstake',
    UnfreezeBalanceV2Contract: 'unstake',
    VoteWitnessContract: 'vote',
    WithdrawExpireUnfreezeContract: 'withdraw',
    WithdrawBalanceContract: 'claim',
};
