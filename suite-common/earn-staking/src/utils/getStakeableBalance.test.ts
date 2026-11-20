import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';

import { getStakeableBalance } from './getStakeableBalance';

const limitsWithDeposit = (registrationDeposit: string) => ({
    ...mockStakingProductDescriptor().limits,
    registrationDeposit: stakingAmountSchema.parse(registrationDeposit),
});

describe('getStakeableBalance', () => {
    it('takes the registration deposit off the available balance', () => {
        expect(
            getStakeableBalance({
                availableBalance: '100000000',
                limits: limitsWithDeposit('2000000'),
            }),
        ).toBe('98000000');
    });

    it('is nothing while the balance does not cover the deposit', () => {
        expect(
            getStakeableBalance({
                availableBalance: '1500000',
                limits: limitsWithDeposit('2000000'),
            }),
        ).toBe('0');
    });

    it('is the whole balance on a product without a deposit', () => {
        expect(
            getStakeableBalance({
                availableBalance: '3000000000000000000',
                limits: limitsWithDeposit('0'),
            }),
        ).toBe('3000000000000000000');
    });
});
