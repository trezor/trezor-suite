import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';

import { buildClaimContract, buildClaimReviewForm } from './contracts/claimContract';
import { buildFreezeContract, buildFreezeReviewForm } from './contracts/freezeContract';
import { buildUnstakeContract, buildUnstakeReviewForm } from './contracts/unstakeContract';
import { buildVoteContract, buildVoteReviewForm } from './contracts/voteContract';
import { buildWithdrawContract, buildWithdrawReviewForm } from './contracts/withdrawContract';
import { tronStakingAdapter } from './tronStakingAdapter';

const OWNER_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const REPRESENTATIVE_A = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const REPRESENTATIVE_B = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';
const INVALID_ADDRESS = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5';

const NOW_SECONDS = 1_700_000_000;

const tronAccount = (overrides: Partial<Account> = {}): Account =>
    ({
        symbol: asNetworkSymbol('trx'),
        networkType: 'tron',
        descriptor: OWNER_ADDRESS,
        misc: {
            tronResources: {
                stakingInfo: {
                    stakedBalance: '0',
                    votes: [],
                    unstakingBatches: [
                        { amount: '4000000', expireTime: NOW_SECONDS - 1 },
                        { amount: '6000000', expireTime: NOW_SECONDS + 1 },
                    ],
                    unclaimedReward: '1500000',
                },
            },
        },
        ...overrides,
    }) as unknown as Account;

const { planStep } = tronStakingAdapter;

describe('Tron staking step planning', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('plans a freeze with its contract and review', () => {
        const account = tronAccount();

        expect(
            planStep({ type: 'freeze', amount: '12.5', resourceType: 'energy' }, account),
        ).toEqual({
            success: true,
            step: {
                type: 'freeze',
                amount: '12.5',
                resourceType: 'energy',
                contract: buildFreezeContract(account, '12.5', 'energy'),
                reviewForm: buildFreezeReviewForm('energy'),
            },
        });
    });

    it('plans an unstake with its contract and review', () => {
        const account = tronAccount();

        expect(
            planStep({ type: 'unstake', amount: '3', resourceType: 'bandwidth' }, account),
        ).toEqual({
            success: true,
            step: {
                type: 'unstake',
                amount: '3',
                resourceType: 'bandwidth',
                contract: buildUnstakeContract(account, '3', 'bandwidth'),
                reviewForm: buildUnstakeReviewForm('bandwidth'),
            },
        });
    });

    it('plans a vote with only the allocations that carry votes', () => {
        const account = tronAccount();
        const voted = [{ address: REPRESENTATIVE_A, count: 7 }];

        expect(
            planStep(
                {
                    type: 'vote',
                    allocations: [...voted, { address: REPRESENTATIVE_B, count: 0 }],
                },
                account,
            ),
        ).toEqual({
            success: true,
            step: {
                type: 'vote',
                allocations: voted,
                contract: buildVoteContract(account, voted),
                reviewForm: buildVoteReviewForm(voted),
            },
        });
    });

    it('plans a withdrawal of the expired unfreezes and a claim of the rewards', () => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
        const account = tronAccount();

        expect(planStep({ type: 'withdraw' }, account)).toEqual({
            success: true,
            step: {
                type: 'withdraw',
                amount: '4',
                contract: buildWithdrawContract(account),
                reviewForm: buildWithdrawReviewForm(),
            },
        });
        expect(planStep({ type: 'claim' }, account)).toEqual({
            success: true,
            step: {
                type: 'claim',
                amount: '1.5',
                contract: buildClaimContract(account),
                reviewForm: buildClaimReviewForm(),
            },
        });
    });

    it('rejects an account of another network', () => {
        expect(
            planStep(
                { type: 'claim' },
                tronAccount({ networkType: 'ethereum' } as Partial<Account>),
            ),
        ).toEqual({ success: false, error: { code: 'UNSUPPORTED_NETWORK' } });
    });

    it.each(['0', '-1', 'abc', ''])('rejects the amount %p', amount => {
        expect(planStep({ type: 'freeze', amount, resourceType: 'energy' }, tronAccount())).toEqual(
            { success: false, error: { code: 'INVALID_AMOUNT' } },
        );
    });

    it('rejects an owner address the contract cannot encode', () => {
        const account = tronAccount({ descriptor: asAccountDescriptor(INVALID_ADDRESS) });

        expect(planStep({ type: 'withdraw' }, account)).toEqual({
            success: false,
            error: { code: 'INVALID_OWNER_ADDRESS' },
        });
        expect(planStep({ type: 'unstake', amount: '1', resourceType: 'energy' }, account)).toEqual(
            { success: false, error: { code: 'INVALID_OWNER_ADDRESS' } },
        );
    });

    it('votes on the Tron mainnet only', () => {
        expect(
            planStep(
                { type: 'vote', allocations: [{ address: REPRESENTATIVE_A, count: 1 }] },
                tronAccount({ symbol: asNetworkSymbol('ttrx') }),
            ),
        ).toEqual({ success: false, error: { code: 'VOTING_UNSUPPORTED_NETWORK' } });
    });

    it('rejects a vote without votes or with an unknown representative', () => {
        const account = tronAccount();

        expect(
            planStep(
                { type: 'vote', allocations: [{ address: REPRESENTATIVE_A, count: 0 }] },
                account,
            ),
        ).toEqual({ success: false, error: { code: 'INVALID_VOTE_ALLOCATION' } });
        expect(
            planStep(
                { type: 'vote', allocations: [{ address: INVALID_ADDRESS, count: 1 }] },
                account,
            ),
        ).toEqual({ success: false, error: { code: 'INVALID_VOTE_ALLOCATION' } });
    });
});
