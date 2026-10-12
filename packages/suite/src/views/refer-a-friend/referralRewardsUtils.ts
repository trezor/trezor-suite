import { type ReferralVoucher } from './mockReferralProgram';

export const getReferralRewardsSummary = (vouchers: ReferralVoucher[], rewardAmount: number) => {
    const referralCount = vouchers.filter(voucher =>
        ['ready', 'used', 'expired'].includes(voucher.status),
    ).length;

    return {
        referralCount,
        totalEarned: referralCount * rewardAmount,
        readyVoucherCount: vouchers.filter(voucher => voucher.status === 'ready').length,
    };
};
