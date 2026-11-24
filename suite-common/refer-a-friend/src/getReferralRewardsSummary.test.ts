import { getReferralRewardsSummary } from './getReferralRewardsSummary';
import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendSchemas';

// The summary reads only the status, amount and dates, so the status-specific fields are left loose.
const createVoucher = (status: ReferralVoucherStatus, amount: number) =>
    ({
        code: status === 'pending' ? null : 'TREF-0000-0000',
        status,
        amount,
        fiatCurrency: 'USD',
        orderPaidAt: '2026-09-15T15:30:00Z',
        availableAt: '2026-10-15T00:00:00Z',
        expiresAt: null,
        usedAt: null,
    }) as ReferralVoucher;

describe(getReferralRewardsSummary.name, () => {
    it('returns zeros for no vouchers', () => {
        const emptySummary = {
            totalEarned: 0,
            availableVoucherCount: 0,
            rewardWaitingPeriodDays: null,
        };

        expect(getReferralRewardsSummary([])).toEqual(emptySummary);
        expect(getReferralRewardsSummary()).toEqual(emptySummary);
    });

    it('sums amounts of earned vouchers and counts available ones', () => {
        const vouchers = [
            createVoucher('available', 20.4),
            createVoucher('available', 25.2),
            createVoucher('used', 10),
            createVoucher('expired', 5),
            createVoucher('pending', 100),
            createVoucher('canceled', 1000),
        ];

        expect(getReferralRewardsSummary(vouchers)).toEqual({
            totalEarned: 60.6,
            availableVoucherCount: 2,
            rewardWaitingPeriodDays: 30,
        });
    });

    it('takes the longest waiting period of all vouchers, rounded up to days', () => {
        const vouchers = [
            createVoucher('available', 20),
            { ...createVoucher('pending', 20), availableAt: '2026-10-25T16:00:00Z' },
        ];

        expect(getReferralRewardsSummary(vouchers).rewardWaitingPeriodDays).toBe(41);
    });

    it('ignores vouchers with invalid dates in the waiting period', () => {
        const validVoucher = createVoucher('available', 20);
        const invalidAvailableAtVoucher = {
            ...createVoucher('pending', 20),
            availableAt: 'invalid',
        };
        const invalidOrderPaidAtVoucher = { ...createVoucher('pending', 20), orderPaidAt: '' };

        expect(
            getReferralRewardsSummary([
                invalidAvailableAtVoucher,
                validVoucher,
                invalidOrderPaidAtVoucher,
            ]).rewardWaitingPeriodDays,
        ).toBe(30);
        expect(
            getReferralRewardsSummary([invalidAvailableAtVoucher, invalidOrderPaidAtVoucher])
                .rewardWaitingPeriodDays,
        ).toBeNull();
    });
});
