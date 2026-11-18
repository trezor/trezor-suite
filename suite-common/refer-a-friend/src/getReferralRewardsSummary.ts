import { type ReferralVoucher, type ReferralVoucherStatus } from './referAFriendTypes';

const earnedVoucherStatuses: ReferralVoucherStatus[] = ['available', 'used', 'expired'];

const DAY_MS = 24 * 60 * 60 * 1000;

const getWaitingPeriodDays = (voucher: ReferralVoucher) =>
    Math.ceil(
        (new Date(voucher.readyAt).getTime() - new Date(voucher.orderPaidAt).getTime()) / DAY_MS,
    );

// TODO: Redesign it. The waiting period differs per voucher and the API has no general value, so the
// longest one is shown. Without vouchers, there is none.
const getRewardWaitingPeriodDays = (vouchers: ReferralVoucher[]) =>
    vouchers.length === 0 ? null : Math.max(...vouchers.map(getWaitingPeriodDays));

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
