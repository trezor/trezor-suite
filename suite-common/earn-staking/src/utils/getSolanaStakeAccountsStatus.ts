import type {
    SolanaStakeAccountStatus,
    StakingPositionDetails,
} from '@suite-common/earn-staking-common';

const SOLANA_STAKE_ACCOUNTS_STATUSES = [
    'inactive',
    'activating',
] as const satisfies readonly SolanaStakeAccountStatus[];

export type SolanaStakeAccountsStatus = (typeof SOLANA_STAKE_ACCOUNTS_STATUSES)[number];

// The stake is still on its way while any account is inactive, then while any is activating.
export const getSolanaStakeAccountsStatus = (
    details: StakingPositionDetails | null,
): SolanaStakeAccountsStatus | null => {
    if (details?.kind !== 'solana-stake-accounts') {
        return null;
    }

    return (
        SOLANA_STAKE_ACCOUNTS_STATUSES.find(status =>
            details.stakeAccounts.some(account => account.status === status),
        ) ?? null
    );
};
