import type { StakingAccount } from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { parseSolanaStakeAccounts } from './solanaStakeAccounts';

const EVERSTAKE_VOTE_ACCOUNT = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
const OTHER_VOTE_ACCOUNT = 'ExternalValidatorPubkey111111111111111111111';

const mockSolanaAccount = (misc: StakingAccount['misc']) =>
    mockStakingAccount({ symbol: asNetworkSymbol('sol'), misc });

describe('parseSolanaStakeAccounts', () => {
    it('reads the Everstake and the external list', () => {
        const account = mockSolanaAccount({
            solStakingAccounts: [
                {
                    status: 'active',
                    stake: '4000000000',
                    rentExemptReserve: '2282880',
                    voterPubkey: EVERSTAKE_VOTE_ACCOUNT,
                    activationEpoch: 790,
                },
            ],
            solExternalStakingAccounts: [
                {
                    status: 'deactivated',
                    stake: '1000000000',
                    rentExemptReserve: '2282880',
                    voterPubkey: OTHER_VOTE_ACCOUNT,
                    activationEpoch: 780,
                },
            ],
            solEpoch: 800,
        });

        expect(parseSolanaStakeAccounts(account)).toEqual([
            {
                status: 'active',
                stake: '4000000000',
                voteAccount: EVERSTAKE_VOTE_ACCOUNT,
                activationEpoch: 790,
            },
            {
                status: 'deactivated',
                stake: '1000000000',
                voteAccount: OTHER_VOTE_ACCOUNT,
                activationEpoch: 780,
            },
        ]);
    });

    it('defaults a missing stake, vote account and activation epoch', () => {
        const account = mockSolanaAccount({
            solStakingAccounts: [{ status: 'activating', rentExemptReserve: '2282880' }],
        });

        expect(parseSolanaStakeAccounts(account)).toEqual([
            { status: 'activating', stake: '0', voteAccount: null, activationEpoch: null },
        ]);
    });

    it.each([
        { name: 'an unknown status', entry: { status: 'cooling', stake: '1000000000' } },
        { name: 'a stake that is not in base units', entry: { status: 'active', stake: '1.5' } },
    ])('leaves out an entry with $name', ({ entry }) => {
        const account = mockSolanaAccount({
            solStakingAccounts: [
                { ...entry, rentExemptReserve: '2282880' },
                { status: 'active', stake: '2000000000', rentExemptReserve: '2282880' },
            ],
        });

        expect(parseSolanaStakeAccounts(account)).toEqual([
            { status: 'active', stake: '2000000000', voteAccount: null, activationEpoch: null },
        ]);
    });

    it('reads nothing from an account without staking data', () => {
        expect(parseSolanaStakeAccounts(mockSolanaAccount({}))).toEqual([]);
        expect(parseSolanaStakeAccounts(mockSolanaAccount(undefined))).toEqual([]);
    });
});
