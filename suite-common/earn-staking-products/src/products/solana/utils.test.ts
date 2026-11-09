import { type StakingAccount } from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getSolanaExpectedEpochReward, parseSolanaStakeAccounts } from './utils';
import { toStakingAmount } from '../../utils/stakingAmounts';

describe('utils', () => {
    describe('getSolanaExpectedEpochReward', () => {
        // The yield-bearing stakes and epoch rewards of the P0.1 Solana snapshot, in lamports.
        it.each([
            { stake: '5000000000', expected: '854795' },
            { stake: '2000000000', expected: '341918' },
            { stake: '6000000000', expected: '1025753' },
            { stake: '0', expected: '0' },
        ])('earns $expected on $stake at 6.24 %', ({ stake, expected }) => {
            expect(
                getSolanaExpectedEpochReward({
                    yieldBearingStake: toStakingAmount(stake),
                    rate: 6.24,
                }),
            ).toBe(expected);
        });

        it('earns nothing without a rate', () => {
            expect(
                getSolanaExpectedEpochReward({
                    yieldBearingStake: toStakingAmount('5000000000'),
                    rate: null,
                }),
            ).toBe('0');
        });
    });

    describe('parseSolanaStakeAccounts', () => {
        const EVERSTAKE_VOTE_ACCOUNT = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
        const OTHER_VOTE_ACCOUNT = 'ExternalValidatorPubkey111111111111111111111';

        const mockSolanaAccount = (misc: StakingAccount['misc']) =>
            mockStakingAccount({ symbol: asNetworkSymbol('sol'), misc });

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
                    rentExemptReserve: '2282880',
                    voteAccount: EVERSTAKE_VOTE_ACCOUNT,
                    activationEpoch: 790,
                },
                {
                    status: 'deactivated',
                    stake: '1000000000',
                    rentExemptReserve: '2282880',
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
                {
                    status: 'activating',
                    stake: '0',
                    rentExemptReserve: '2282880',
                    voteAccount: null,
                    activationEpoch: null,
                },
            ]);
        });

        it.each([
            { name: 'an unknown status', entry: { status: 'cooling', stake: '1000000000' } },
            {
                name: 'a stake that is not in base units',
                entry: { status: 'active', stake: '1.5' },
            },
            {
                name: 'a rent reserve that is not in base units',
                entry: { status: 'active', stake: '1000000000', rentExemptReserve: '-1' },
            },
        ])('leaves out an entry with $name', ({ entry }) => {
            const account = mockSolanaAccount({
                solStakingAccounts: [
                    { rentExemptReserve: '2282880', ...entry },
                    { status: 'active', stake: '2000000000', rentExemptReserve: '2282880' },
                ],
            });

            expect(parseSolanaStakeAccounts(account)).toEqual([
                {
                    status: 'active',
                    stake: '2000000000',
                    rentExemptReserve: '2282880',
                    voteAccount: null,
                    activationEpoch: null,
                },
            ]);
        });

        it('reads nothing from an account without staking data', () => {
            expect(parseSolanaStakeAccounts(mockSolanaAccount({}))).toEqual([]);
            expect(parseSolanaStakeAccounts(mockSolanaAccount(undefined))).toEqual([]);
        });
    });
});
