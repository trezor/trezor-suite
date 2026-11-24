export type ReferralRequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ReferralProgramData = {
    rewardAmount: string;
    friendDiscountPercentage: number;
    minimumOrderAmount: string;
    periodReferralLimit: number;
    periodRewardAmountLimit: string;
};

type InactiveReferralAccount = {
    status: 'none' | 'left';
    joinedAt: null;
    code: null;
    shareUrl: null;
    redemptionCount: null;
    redemptionLimit: null;
    redemptionLimitResetsAt: null;
};
type ActiveReferralAccount = {
    status: 'active';
    joinedAt: string;
    code: string;
    shareUrl: string;
    redemptionCount: number;
    redemptionLimit: number;
    // Expected to be defined only when the user is at their redemptions limit.
    redemptionLimitResetsAt: string | null;
};

export type ReferralAccount = InactiveReferralAccount | ActiveReferralAccount;
export type ReferralAccountStatus = ReferralAccount['status'];
export type ReferralAccountLoadStatus = ReferralRequestStatus | 'keyMissing';

type ReferralVoucherBase = {
    amount: number;
    fiatCurrency: string;
    orderPaidAt: string;
    availableAt: string;
};
type PendingReferralVoucher = ReferralVoucherBase & {
    status: 'pending';
    code: null;
    expiresAt: null;
    usedAt: null;
};
type AvailableReferralVoucher = ReferralVoucherBase & {
    status: 'available';
    code: string;
    expiresAt: string;
    usedAt: null;
};
type UsedReferralVoucher = ReferralVoucherBase & {
    status: 'used';
    code: string;
    expiresAt: string;
    usedAt: string;
};
type ExpiredReferralVoucher = ReferralVoucherBase & {
    status: 'expired';
    code: string;
    expiresAt: string;
    usedAt: null;
};
type CanceledReferralVoucher = ReferralVoucherBase & {
    status: 'canceled';
    code: string;
    expiresAt: string;
    usedAt: null;
};

export type ReferralVoucher =
    | PendingReferralVoucher
    | AvailableReferralVoucher
    | UsedReferralVoucher
    | ExpiredReferralVoucher
    | CanceledReferralVoucher;
export type ReferralVoucherStatus = ReferralVoucher['status'];

// Distributes over the union, so each voucher variant keeps its own shape.
type WithLooseAmount<Voucher> = Voucher extends unknown
    ? Omit<Voucher, 'amount'> & { amount: number | string }
    : never;

export type ReferralVouchersResponse = {
    // The API may send the amount as a decimal string, e.g. "20.00".
    vouchers: Array<WithLooseAmount<ReferralVoucher>>;
};

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
