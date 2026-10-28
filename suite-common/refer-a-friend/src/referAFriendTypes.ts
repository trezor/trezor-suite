import {
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
} from '@suite-common/suite-types';

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

export type ReferralVoucherStatus = 'pending' | 'ready' | 'used' | 'expired' | 'canceled';

export type ReferralVoucher = {
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

export type ReferralApiErrorCode =
    'badRequest' | 'signatureInvalid' | 'timestampExpired' | 'accountRequired' | 'rateLimited';

export type ReferralApiError = {
    type: 'ApiError';
    // Null when the response body does not carry a known error code.
    code: ReferralApiErrorCode | null;
    httpStatus: number;
};

export type ReferralFetchError = {
    type: 'FetchError';
    message: string;
};

export type ReferralRequestError = ReferralApiError | ReferralFetchError;

export type StandardWalletUnavailableError = {
    type: 'StandardWalletUnavailable';
};

export type ReferralDeviceError =
    | DeviceCancelledErrType
    | DeviceErrorType
    | DeviceNotConnectedErrorType
    | StandardWalletUnavailableError;

export type ReferralError = ReferralRequestError | ReferralDeviceError;
