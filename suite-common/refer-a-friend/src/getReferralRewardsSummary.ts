import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendTypes';

const earnedVoucherStatuses: ReferralVoucherStatus[] = ['ready', 'used', 'expired'];

// Every voucher can have a different amount, so the total is a sum, not a multiple.
export const getReferralRewardsSummary = (vouchers: ReferralVoucher[]) => ({
    totalEarned: vouchers
        .filter(voucher => earnedVoucherStatuses.includes(voucher.status))
        .reduce((total, voucher) => total + voucher.amount, 0),
    readyVoucherCount: vouchers.filter(voucher => voucher.status === 'ready').length,
});
