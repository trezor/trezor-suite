import { ADA, ETH, adaProduct, ethProduct } from './earnStakingTableTestState';
import { getEarnStakingPotentialRewards } from './getEarnStakingPotentialRewards';

const ONE_ETH = '1000000000000000000';
const HUNDREDTH_ETH = '10000000000000000';

describe('getEarnStakingPotentialRewards', () => {
    it('adds what the available balance would earn to the current rewards', () => {
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0.1',
                availableBalance: ONE_ETH,
                limits: ethProduct.limits,
                rate: 5,
                networkSymbol: ETH,
            }),
        ).toBe('0.15');
    });

    it('rates the available balance alone for an account that does not stake', () => {
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0',
                availableBalance: ONE_ETH,
                limits: ethProduct.limits,
                rate: 5,
                networkSymbol: ETH,
            }),
        ).toBe('0.05');
    });

    it('keeps the current rewards while the available balance is below the minimum', () => {
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0.1',
                availableBalance: HUNDREDTH_ETH,
                limits: ethProduct.limits,
                rate: 5,
                networkSymbol: ETH,
            }),
        ).toBe('0.1');
    });

    it('leaves the registration deposit out of what a Cardano balance would earn', () => {
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0',
                availableBalance: '12000000',
                limits: adaProduct.limits,
                rate: 3,
                networkSymbol: ADA,
            }),
        ).toBe('0.3');
    });

    it('answers the current rewards without a rate or a product', () => {
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0',
                availableBalance: ONE_ETH,
                limits: ethProduct.limits,
                rate: null,
                networkSymbol: ETH,
            }),
        ).toBe('0');
        expect(
            getEarnStakingPotentialRewards({
                currentRewards: '0.1',
                availableBalance: ONE_ETH,
                limits: null,
                rate: 5,
                networkSymbol: ETH,
            }),
        ).toBe('0.1');
    });
});
