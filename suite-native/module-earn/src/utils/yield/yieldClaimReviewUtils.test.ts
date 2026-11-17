import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldActionReviewState } from '@suite-common/wallet-core';

import { buildYieldClaimRewards } from './yieldClaimReviewUtils';

type YieldClaimReview = Extract<YieldActionReviewState, { type: 'claim' }>;

const TOKEN_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

type ClaimRewardToken = YieldClaimReview['rewards'][number]['token'] &
    YieldClaimReview['rewards'][number]['tokenInfo'];

const createClaimReview = (rewards: ClaimRewardToken[]): YieldClaimReview => ({
    type: 'claim',
    rewards: rewards.map(({ networkSymbol, contractAddress, symbol, decimals }) => ({
        token: { networkSymbol, contractAddress },
        tokenInfo: { symbol, decimals },
        value: '0.848795999565318',
        fiatValue: '1.25',
    })),
    unsignedTransaction: {
        to: '0x3ef3d8ba38ebe18db133cec108f4d14ce00dd9ae',
        data: '0x71ee95c0',
        chainId: 1,
        gasLimit: '21000',
        maxFeePerGas: '2000000000',
        maxPriorityFeePerGas: '1000000000',
        nonce: '10',
    },
});

describe('buildYieldClaimRewards', () => {
    it('maps every reward to its token address and symbol', () => {
        const review = createClaimReview([
            {
                networkSymbol: asNetworkSymbol('eth'),
                symbol: 'USDC',
                decimals: 6,
                contractAddress: toTokenAddress(TOKEN_ADDRESS),
            },
        ]);

        expect(buildYieldClaimRewards(review)).toEqual([
            { token: { address: TOKEN_ADDRESS, symbol: 'USDC' } },
        ]);
    });

    it('throws when a reward is missing a token contract address', () => {
        const review = createClaimReview([
            {
                networkSymbol: asNetworkSymbol('eth'),
                symbol: 'USDC',
                decimals: 6,
                contractAddress: toTokenAddress(TOKEN_ADDRESS),
            },
            {
                networkSymbol: asNetworkSymbol('eth'),
                symbol: 'MORPHO',
                decimals: 18,
                contractAddress: undefined,
            },
        ]);

        expect(() => buildYieldClaimRewards(review)).toThrow(
            'Yield claim reward is missing a token contract address.',
        );
    });
});
