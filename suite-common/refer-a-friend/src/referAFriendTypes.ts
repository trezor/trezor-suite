import { type ReferralVoucher } from './referAFriendSchemas';

export type ReferralRequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ReferralProgramData = {
    rewardAmount: string;
    friendDiscountPercentage: number;
    minimumOrderAmount: string;
    periodReferralLimit: number;
    periodRewardAmountLimit: string;
};

export type ReferralAccountLoadStatus = ReferralRequestStatus | 'keyMissing';

export type ReferralRewards = {
    status: ReferralAccountLoadStatus;
    fiatCurrency: string;
    totalEarnedAmount: number;
    availableVoucherCount: number;
    vouchers: ReferralVoucher[];
};

export type ReferralError = {
    message: string;
    httpStatus?: number;
    // The `error` field of the API response body, or the Connect error code.
    code?: string;
};
