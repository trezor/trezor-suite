import { type StakingOperation, type StakingTransaction } from '@suite-common/earn-staking-common';

// Copied from wallet-constants; unstaking is immediate on chain, the legacy period is kept.
export const CARDANO_EPOCH_DAYS = 5;

type CardanoStakingSubtype = NonNullable<
    NonNullable<StakingTransaction['cardanoSpecific']>['subtype']
>;

export const CARDANO_STAKING_OPERATIONS_BY_SUBTYPE: Record<
    CardanoStakingSubtype,
    StakingOperation
> = {
    stake_registration: 'stake',
    stake_delegation: 'stake',
    stake_deregistration: 'unstake',
    withdrawal: 'claim',
    governance_delegation: 'vote',
};
