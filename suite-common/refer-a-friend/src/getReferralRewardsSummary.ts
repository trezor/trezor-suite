import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendSchemas';

const earnedVoucherStatuses: ReferralVoucherStatus[] = ['available', 'used', 'expired'];

const roundToCents = (value: number) => Math.round(value * 100) / 100;

export const getReferralRewardsSummary = (vouchers: ReferralVoucher[] = []) => ({
    totalEarned: roundToCents(
        vouchers
            .filter(voucher => earnedVoucherStatuses.includes(voucher.status))
            .reduce((total, voucher) => total + voucher.amount, 0),
    ),
    availableVoucherCount: vouchers.filter(voucher => voucher.status === 'available').length,
});
