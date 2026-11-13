import { type StakingOperation, type StakingTransaction } from '@suite-common/earn-staking-common';

// The legacy SOLANA_EPOCH_DAYS: delegating and deactivating both take one epoch, counted as one day.
export const SOLANA_EPOCH_DAYS = 1;

type SolanaStakeType = NonNullable<
    NonNullable<StakingTransaction['solanaSpecific']>['stakeOperation']
>['type'];

export const SOLANA_STAKING_OPERATIONS_BY_STAKE_TYPE: Partial<
    Record<SolanaStakeType, StakingOperation>
> = {
    stake: 'stake',
    unstake: 'unstake',
    claim: 'withdraw',
};
