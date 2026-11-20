export type ReferralProgram = {
    fiatCurrency: string;
    rewardAmount: number;
    friendDiscountPercentage: number;
    minimumOrderAmount: number;
    redemptionLimit: number;
    termsUrl: string;
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
    redemptionLimitResetsAt: string;
};

export type ReferralAccount = InactiveReferralAccount | ActiveReferralAccount;
export type ReferralAccountStatus = ReferralAccount['status'];

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
    expiresAt: string | null;
    usedAt: null;
};
type UsedReferralVoucher = ReferralVoucherBase & {
    status: 'used';
    code: string | null;
    expiresAt: string | null;
    usedAt: string;
};
type ExpiredReferralVoucher = ReferralVoucherBase & {
    status: 'expired';
    code: string | null;
    expiresAt: string;
    usedAt: null;
};
// Canceled when the order is returned or canceled, possibly even after it became available.
type CanceledReferralVoucher = ReferralVoucherBase & {
    status: 'canceled';
    code: string | null;
    expiresAt: string | null;
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
    vouchers: Array<Omit<ReferralVoucher, 'amount'> & { amount: number | string }>;
};

export type ReferralError = {
    message: string;
    httpStatus?: number;
    // The `error` field of the API response body, or the Connect error code.
    code?: string;
};
