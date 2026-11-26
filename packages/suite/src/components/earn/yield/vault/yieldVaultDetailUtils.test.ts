import { type RewardDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';

import { getBonusRewards } from './yieldVaultDetailUtils';

const USDC: RewardDtoV2['token'] = {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    network: 'ethereum',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

const MORPHO: RewardDtoV2['token'] = {
    symbol: 'MORPHO',
    name: 'Morpho',
    decimals: 18,
    network: 'ethereum',
    address: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
};

const ARB: RewardDtoV2['token'] = {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    network: 'ethereum',
    address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
};

const reward = (
    token: RewardDtoV2['token'],
    yieldSource: RewardDtoV2['yieldSource'],
    rate: number,
): RewardDtoV2 => ({ token, yieldSource, rate, rateType: 'APY' });

const createVault = (components: RewardDtoV2[]): Pick<YieldDtoV2, 'token' | 'rewardRate'> => ({
    token: USDC,
    rewardRate: {
        total: components.reduce((sum, component) => sum + component.rate, 0),
        rateType: 'APY',
        components,
    },
});

describe('getBonusRewards', () => {
    it('returns one entry per payout token other than the underlying asset', () => {
        const vault = createVault([
            reward(USDC, 'lending', 0.04),
            reward(MORPHO, 'protocol_incentive', 0.01),
            reward(ARB, 'campaign_incentive', 0.02),
        ]);

        expect(getBonusRewards(vault)).toEqual([
            { token: MORPHO, rate: 0.01 },
            { token: ARB, rate: 0.02 },
        ]);
    });

    it('sums rewards paid in the same token', () => {
        const vault = createVault([
            reward(USDC, 'lending', 0.04),
            reward(MORPHO, 'protocol_incentive', 0.01),
            reward(
                { ...MORPHO, address: MORPHO.address!.toUpperCase() },
                'campaign_incentive',
                0.02,
            ),
        ]);

        expect(getBonusRewards(vault)).toEqual([{ token: MORPHO, rate: 0.03 }]);
    });

    it('keeps incentives paid in the underlying asset out of the bonus', () => {
        const vault = createVault([
            reward(USDC, 'lending', 0.04),
            reward({ ...USDC, address: USDC.address!.toUpperCase() }, 'campaign_incentive', 0.01),
        ]);

        expect(getBonusRewards(vault)).toEqual([]);
    });

    it('ignores components without a positive rate', () => {
        const vault = createVault([
            reward(USDC, 'lending', 0.04),
            reward(MORPHO, 'protocol_incentive', 0),
        ]);

        expect(getBonusRewards(vault)).toEqual([]);
    });
});
