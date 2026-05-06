import { type RewardDto, type TokenDto } from '../../api';
import { sortRewardsByUnderlyingToken } from '../../utils/sortRewardsByUnderlyingToken';

const USDC: TokenDto = {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    network: 'ethereum',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

const MORPHO: TokenDto = {
    symbol: 'MORPHO',
    name: 'Morpho',
    decimals: 18,
    network: 'ethereum',
    address: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
};

const ARB: TokenDto = {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    network: 'arbitrum',
    address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
};

const reward = (
    token: TokenDto,
    yieldSource: RewardDto['yieldSource'],
    rate: number,
): RewardDto => ({ token, yieldSource, rate, rateType: 'APY' });

describe('sortRewardsByUnderlyingToken', () => {
    it('puts the underlying-asset reward first', () => {
        const underlying = reward(USDC, 'lending_interest', 0.04);
        const incentive = reward(MORPHO, 'protocol_incentive', 0.1);

        expect(sortRewardsByUnderlyingToken([incentive, underlying], USDC)).toEqual([
            underlying,
            incentive,
        ]);
    });

    it('matches underlying token by address case-insensitively', () => {
        const underlyingToken: TokenDto = { ...USDC, address: USDC.address!.toUpperCase() };
        const underlying = reward(USDC, 'lending_interest', 0.04);
        const incentive = reward(MORPHO, 'protocol_incentive', 0.5);

        const [first] = sortRewardsByUnderlyingToken([incentive, underlying], underlyingToken);

        expect(first).toBe(underlying);
    });

    it('sorts non-underlying rewards by rate descending', () => {
        const underlying = reward(USDC, 'lending_interest', 0.04);
        const incentiveHigh = reward(MORPHO, 'protocol_incentive', 0.2);
        const incentiveLow = reward(ARB, 'protocol_incentive', 0.01);

        const sorted = sortRewardsByUnderlyingToken(
            [incentiveLow, incentiveHigh, underlying],
            USDC,
        );

        expect(sorted).toEqual([underlying, incentiveHigh, incentiveLow]);
    });

    it('falls back to rate-only sort when underlying is missing from rewards', () => {
        const incentiveHigh = reward(MORPHO, 'protocol_incentive', 0.2);
        const incentiveLow = reward(ARB, 'protocol_incentive', 0.01);

        expect(sortRewardsByUnderlyingToken([incentiveLow, incentiveHigh], USDC)).toEqual([
            incentiveHigh,
            incentiveLow,
        ]);
    });

    it('falls back to rate-only sort when underlyingToken is undefined', () => {
        const lending = reward(USDC, 'lending_interest', 0.04);
        const incentive = reward(MORPHO, 'protocol_incentive', 0.2);

        expect(sortRewardsByUnderlyingToken([lending, incentive], undefined)).toEqual([
            incentive,
            lending,
        ]);
    });
});
