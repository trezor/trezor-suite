import { type StablecoinYieldAccountRewards } from '@suite-common/wallet-core';

import { sortRewardsByClaimableFiatAmount } from './sortRewardsByClaimableFiatAmount';

type Reward = StablecoinYieldAccountRewards['rewards'][number];

const TOKEN_01 = { token: { symbol: 'token-1' }, fiat: { claimable: '1' } } as unknown as Reward;
const TOKEN_02 = { token: { symbol: 'token-2' }, fiat: { claimable: '2' } } as unknown as Reward;
const TOKEN_03 = { token: { symbol: 'token-3' }, fiat: { claimable: '3' } } as unknown as Reward;

describe('sortRewardsByClaimableFiatAmount', () => {
    it('sorts rewards by claimable fiat amount', () => {
        const sorted = [TOKEN_02, TOKEN_03, TOKEN_01].toSorted(sortRewardsByClaimableFiatAmount);

        expect(sorted.map(reward => reward.token.symbol)).toEqual([
            'token-3',
            'token-2',
            'token-1',
        ]);
    });
});
