import {
    type SolanaStakeAccount,
    type StakingPositionDetails,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';

import { getSolanaStakeAccountsStatus } from './getSolanaStakeAccountsStatus';

const stakeAccount = (status: SolanaStakeAccount['status']): SolanaStakeAccount => ({
    status,
    stake: stakingAmountSchema.parse('1000000000'),
    rentExemptReserve: stakingAmountSchema.parse('2282880'),
    activationEpoch: null,
});

const details = (statuses: SolanaStakeAccount['status'][]): StakingPositionDetails => ({
    kind: 'solana-stake-accounts',
    epoch: 700,
    stakeAccounts: statuses.map(stakeAccount),
});

describe('getSolanaStakeAccountsStatus', () => {
    it.each([
        {
            name: 'an inactive account among active ones',
            statuses: ['active', 'inactive'],
            expected: 'inactive',
        },
        {
            name: 'an inactive account before an activating one',
            statuses: ['activating', 'inactive'],
            expected: 'inactive',
        },
        {
            name: 'an activating account among active ones',
            statuses: ['active', 'activating'],
            expected: 'activating',
        },
    ] as const)('is $expected with $name', ({ statuses, expected }) => {
        expect(getSolanaStakeAccountsStatus(details([...statuses]))).toBe(expected);
    });

    it.each([
        {
            name: 'every account is active or leaving',
            statuses: ['active', 'deactivating', 'deactivated'],
        },
        { name: 'there is no stake account', statuses: [] },
    ] as const)('is null when $name', ({ statuses }) => {
        expect(getSolanaStakeAccountsStatus(details([...statuses]))).toBe(null);
    });

    it('is null for details of another kind or none', () => {
        expect(
            getSolanaStakeAccountsStatus({ kind: 'cardano-delegation', poolId: null, drep: null }),
        ).toBe(null);
        expect(getSolanaStakeAccountsStatus(null)).toBe(null);
    });
});
