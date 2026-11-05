import { getSolanaExpectedEpochReward } from './solanaEpochReward';
import { toStakingAmount } from '../shared/stakingAmounts';

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
