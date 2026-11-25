import { getStakingNextPayoutInDays } from './getStakingNextPayoutInDays';

const weeklyDeposit = { rewardPeriodDays: 7, hasStake: false };

describe('getStakingNextPayoutInDays', () => {
    it('has no payout without a dated next payout', () => {
        expect(
            getStakingNextPayoutInDays({
                ...weeklyDeposit,
                nextRewardInDays: null,
                daysUntilActivation: 10,
            }),
        ).toBeNull();
    });

    it('takes the next payout for a stake that earns', () => {
        expect(
            getStakingNextPayoutInDays({
                ...weeklyDeposit,
                hasStake: true,
                nextRewardInDays: 2,
                daysUntilActivation: 10,
            }),
        ).toBe(2);
    });

    it('has no payout for a deposit whose activation cannot be dated', () => {
        expect(
            getStakingNextPayoutInDays({
                ...weeklyDeposit,
                nextRewardInDays: 2,
                daysUntilActivation: null,
            }),
        ).toBeNull();
    });

    it.each([
        { name: 'before the next payout', daysUntilActivation: 1, expected: 2 },
        { name: 'on the next payout day', daysUntilActivation: 2, expected: 2 },
        { name: 'a day after the next payout', daysUntilActivation: 3, expected: 9 },
        { name: 'on a later payout day', daysUntilActivation: 9, expected: 9 },
        { name: 'a day after a later payout', daysUntilActivation: 10, expected: 16 },
    ])(
        'dates the first payout of a deposit activating $name',
        ({ daysUntilActivation, expected }) => {
            expect(
                getStakingNextPayoutInDays({
                    ...weeklyDeposit,
                    nextRewardInDays: 2,
                    daysUntilActivation,
                }),
            ).toBe(expected);
        },
    );

    it('rounds a payout dated in fractional periods', () => {
        expect(
            getStakingNextPayoutInDays({
                nextRewardInDays: 1,
                daysUntilActivation: 3,
                rewardPeriodDays: 2.5,
                hasStake: false,
            }),
        ).toBe(4);
    });

    it('has no payout for a deposit activating after the next payout without a period', () => {
        expect(
            getStakingNextPayoutInDays({
                nextRewardInDays: 2,
                daysUntilActivation: 10,
                rewardPeriodDays: null,
                hasStake: false,
            }),
        ).toBeNull();
    });
});
