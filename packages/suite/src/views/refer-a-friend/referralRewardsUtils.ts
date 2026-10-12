import { type ReferralVoucher } from './mockReferralProgram';

export const getReferralRewardsSummary = (vouchers: ReferralVoucher[], rewardAmount: number) => {
    const earnedVoucherCount = vouchers.filter(voucher =>
        ['ready', 'used', 'expired'].includes(voucher.status),
    ).length;

    return {
        referralCount: vouchers.length,
        totalEarned: earnedVoucherCount * rewardAmount,
        readyVoucherCount: vouchers.filter(voucher => voucher.status === 'ready').length,
    };
};
