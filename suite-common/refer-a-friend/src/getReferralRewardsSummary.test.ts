import { getReferralRewardsSummary } from './getReferralRewardsSummary';
import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendTypes';

const createVoucher = (status: ReferralVoucherStatus, amount: number): ReferralVoucher => ({
    voucher: status === 'pending' ? null : 'TREF-0000-0000',
    status,
    amount,
    fiatCurrency: 'USD',
    orderPaidAt: '2026-09-15T15:30:00Z',
    readyAt: '2026-10-15T00:00:00Z',
    expiresAt: null,
    usedAt: null,
});

describe(getReferralRewardsSummary.name, () => {
    it('returns zeros for no vouchers', () => {
        expect(getReferralRewardsSummary([])).toEqual({ totalEarned: 0, readyVoucherCount: 0 });
    });

    it('sums amounts of earned vouchers and counts ready ones', () => {
        const vouchers = [
            createVoucher('ready', 20),
            createVoucher('ready', 25),
            createVoucher('used', 10),
            createVoucher('expired', 5),
            createVoucher('pending', 100),
            createVoucher('canceled', 1000),
        ];

        expect(getReferralRewardsSummary(vouchers)).toEqual({
            totalEarned: 60,
            readyVoucherCount: 2,
        });
    });
});
