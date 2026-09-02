import { sortRewardsByClaimableFiatAmount } from './sortRewardsByClaimableFiatAmount';
import type { StablecoinYieldAccountRewards } from './stablecoinYieldClaimSummaryUtils';

type Reward = StablecoinYieldAccountRewards['rewards'][number];

const TOKEN_01 = { token: { symbol: 'token-1' }, fiat: { claimable: '1' } } as unknown as Reward;
const TOKEN_02 = { token: { symbol: 'token-2' }, fiat: { claimable: '2' } } as unknown as Reward;
const TOKEN_03 = { token: { symbol: 'token-3' }, fiat: { claimable: '3' } } as unknown as Reward;

const getPermutations = <T>(items: T[]): T[][] => {
    if (items.length <= 1) {
        return [items];
    }

    return items.flatMap((item, index) =>
        getPermutations(items.toSpliced(index, 1)).map(permutation => [item, ...permutation]),
    );
};

const REWARDS = getPermutations([TOKEN_01, TOKEN_02, TOKEN_03]);

describe('sortRewardsByClaimableFiatAmount', () => {
    it.each(REWARDS.map(rewards => [rewards]))(
        'sorts rewards by claimable fiat amount (case %#)',
        rewards => {
            const sorted = rewards.toSorted(sortRewardsByClaimableFiatAmount);

            expect(sorted[0]?.token.symbol).toBe('token-3');
            expect(sorted[1]?.token.symbol).toBe('token-2');
            expect(sorted[2]?.token.symbol).toBe('token-1');
        },
    );
});
