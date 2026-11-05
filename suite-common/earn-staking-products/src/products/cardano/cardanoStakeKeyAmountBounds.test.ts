import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';

import { getCardanoStakeKeyAmountBounds } from './cardanoStakeKeyAmountBounds';

const ADA = '000000';

const position = mockStakingPosition({
    balances: {
        staked: stakingAmountSchema.parse(`1000${ADA}`),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse('0'),
        rewards: stakingAmountSchema.parse('5250000'),
    },
    operations: ['unstake', 'claim', 'vote'],
});

describe('getCardanoStakeKeyAmountBounds', () => {
    it('unstakes exactly the staked balance', () => {
        expect(getCardanoStakeKeyAmountBounds({ position, operation: 'unstake' })).toEqual({
            min: `1000${ADA}`,
            max: `1000${ADA}`,
        });
    });

    it('claims exactly the reward balance', () => {
        expect(getCardanoStakeKeyAmountBounds({ position, operation: 'claim' })).toEqual({
            min: '5250000',
            max: '5250000',
        });
    });

    it('takes no amount for a vote', () => {
        expect(getCardanoStakeKeyAmountBounds({ position, operation: 'vote' })).toEqual({
            min: '0',
            max: '0',
        });
    });

    it.each(['unstake', 'claim', 'vote'] as const)(
        'has no valid amount to %s without a position',
        operation => {
            expect(getCardanoStakeKeyAmountBounds({ position: null, operation })).toEqual({
                min: '1',
                max: '0',
            });
        },
    );

    it.each(['unstake', 'claim', 'vote'] as const)(
        'has no valid amount to %s while the position does not offer it',
        operation => {
            expect(
                getCardanoStakeKeyAmountBounds({
                    position: { ...position, operations: [] },
                    operation,
                }),
            ).toEqual({ min: '1', max: '0' });
        },
    );
});
