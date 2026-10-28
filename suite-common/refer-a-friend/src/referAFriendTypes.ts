export type ReferralProgram = {
    fiatCurrency: string;
    rewardAmount: number;
    friendDiscountPercentage: number;
    minimumOrderAmount: number;
    redemptionLimit: number;
    termsUrl: string;
};

export type ReferralAccountStatus = 'none' | 'active' | 'left';

export type ReferralAccount = {
    status: ReferralAccountStatus;
    joinedAt: string | null;
    code: string | null;
    shareUrl: string | null;
    redemptionCount: number | null;
    redemptionLimit: number | null;
    redemptionLimitResetsAt: string | null;
};

export type ReferralVoucherStatus = 'pending' | 'available' | 'used' | 'expired' | 'canceled';

export type ReferralVoucher = {
    // null if the voucher hasn't been processed yet.
    voucher: string | null;
    status: ReferralVoucherStatus;
    amount: number;
    fiatCurrency: string;
    orderPaidAt: string;
    readyAt: string;
    expiresAt: string | null;
    usedAt: string | null;
};

export type ReferralVouchersResponse = {
    vouchers: ReferralVoucher[];
};

export type ReferralError = {
    message: string;
    httpStatus?: number;
    // The `error` field of the API response body, or the Connect error code.
    code?: string;
};
