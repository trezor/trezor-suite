import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendSchemas';

const earnedVoucherStatuses: ReferralVoucherStatus[] = ['available', 'used', 'expired'];

const DAY_MS = 24 * 60 * 60 * 1000;

const getWaitingPeriodDays = (voucher: ReferralVoucher) =>
    Math.ceil(
        (new Date(voucher.availableAt).getTime() - new Date(voucher.orderPaidAt).getTime()) /
            DAY_MS,
    );

// TODO: Consider redesign. The waiting period is displayed as single value, but it differs per voucher.
const getRewardWaitingPeriodDays = (vouchers: ReferralVoucher[]): number | null => {
    const allWaitingPeriods = vouchers.map(getWaitingPeriodDays).filter(value => !isNaN(value));

    return allWaitingPeriods.length === 0 ? null : Math.max(...allWaitingPeriods);
};

const roundToCents = (value: number) => Math.round(value * 100) / 100;

export const getReferralRewardsSummary = (vouchers: ReferralVoucher[] = []) => ({
    totalEarned: roundToCents(
        vouchers
            .filter(voucher => earnedVoucherStatuses.includes(voucher.status))
            .reduce((total, voucher) => total + voucher.amount, 0),
    ),
    availableVoucherCount: vouchers.filter(voucher => voucher.status === 'available').length,
    rewardWaitingPeriodDays: getRewardWaitingPeriodDays(vouchers),
});
