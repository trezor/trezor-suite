import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';

import { getCardanoEstimatedGainsBalance } from './getCardanoEstimatedGainsBalance';

const amount = (value: string) => stakingAmountSchema.parse(value);

const TEN_THOUSAND_ADA = '10000000000';
const REWARDS = '300000000';
const DEPOSIT = '2000000';

const limits = {
    ...mockStakingProductDescriptor().limits,
    registrationDeposit: amount(DEPOSIT),
};

describe('getCardanoEstimatedGainsBalance', () => {
    it('estimates on the stake of a registered key, reward balance included, deposit paid', () => {
        expect(
            getCardanoEstimatedGainsBalance({
                staked: amount('10300000000'),
                availableBalance: TEN_THOUSAND_ADA,
                limits,
            }),
        ).toBe('10300000000');
    });

    it('estimates on the available balance less the deposit for a key still to register', () => {
        expect(
            getCardanoEstimatedGainsBalance({
                staked: amount('0'),
                availableBalance: TEN_THOUSAND_ADA,
                limits,
            }),
        ).toBe('9998000000');
    });

    it('estimates on nothing when the balance does not cover the deposit', () => {
        expect(
            getCardanoEstimatedGainsBalance({
                staked: amount('0'),
                availableBalance: '1000000',
                limits,
            }),
        ).toBe('0');
    });

    it('ignores a reward balance that is not delegated yet', () => {
        expect(
            getCardanoEstimatedGainsBalance({
                staked: amount('0'),
                availableBalance: REWARDS,
                limits,
            }),
        ).toBe('298000000');
    });
});
