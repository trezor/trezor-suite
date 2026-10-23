import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type TronStakingInfo } from '@trezor/blockchain-link-types';

import { tronStakingAdapter } from './tronStakingAdapter';
import { TRON_REWARD_CLAIM_COOLDOWN_SECONDS } from '../tronStakingConstants';

const REPRESENTATIVE_A = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const REPRESENTATIVE_B = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';

const tronAccount = (stakingInfo?: Partial<TronStakingInfo>): Account =>
    ({
        symbol: asNetworkSymbol('trx'),
        networkType: 'tron',
        misc: { tronResources: { stakingInfo } },
    }) as unknown as Account;

describe('Tron staking rules', () => {
    it('keeps the votes in the order the network reports them', () => {
        const votes = [
            { address: REPRESENTATIVE_B, voteCount: '3' },
            { address: REPRESENTATIVE_A, voteCount: '9' },
        ];

        expect(tronStakingAdapter.getVotes(tronAccount({ votes }))).toEqual(votes);
        expect(tronStakingAdapter.getVotes(tronAccount())).toEqual([]);
    });

    it('casts one vote per whole TRX of voting power', () => {
        const account = tronAccount({ totalVotingPower: '16.9', availableVotingPower: '4.5' });

        expect(tronStakingAdapter.getVotingPower(account)).toEqual({
            total: '16.9',
            available: '4.5',
        });
        expect(tronStakingAdapter.getCastableVotes(account)).toBe(16);
        expect(tronStakingAdapter.getCastableVotes(tronAccount())).toBe(0);
    });

    it('allocates the current votes as whole votes', () => {
        const account = tronAccount({
            votes: [
                { address: REPRESENTATIVE_A, voteCount: '7.8' },
                { address: REPRESENTATIVE_B, voteCount: '0.4' },
            ],
        });

        expect(tronStakingAdapter.getVoteAllocations(account)).toEqual([
            { address: REPRESENTATIVE_A, count: 7 },
        ]);
    });

    it('opens the next reward claim a day after the last one', () => {
        expect(
            tronStakingAdapter.getRewardClaimCooldownEndsAt(
                tronAccount({ latestWithdrawTime: 1_700_000_000 }),
            ),
        ).toBe(1_700_000_000 + TRON_REWARD_CLAIM_COOLDOWN_SECONDS);
        expect(
            tronStakingAdapter.getRewardClaimCooldownEndsAt(tronAccount({ latestWithdrawTime: 0 })),
        ).toBeNull();
    });
});
