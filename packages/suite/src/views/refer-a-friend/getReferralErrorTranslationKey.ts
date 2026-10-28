import { type TranslationKey } from '@suite/intl';
import { type ReferralError } from '@suite-common/refer-a-friend';
import { exhaustive } from '@trezor/type-utils';

export const getReferralErrorTranslationKey = (error: ReferralError): TranslationKey => {
    switch (error.type) {
        case 'FetchError':
            return 'TR_REFERRAL_ERROR_NETWORK';
        case 'ApiError':
            switch (error.code) {
                case 'timestampExpired':
                    return 'TR_REFERRAL_ERROR_TIMESTAMP_EXPIRED';
                case 'rateLimited':
                    return 'TR_REFERRAL_ERROR_RATE_LIMITED';
                case 'signatureInvalid':
                    return 'TR_REFERRAL_ERROR_SIGNATURE_INVALID';
                case 'badRequest':
                case 'accountRequired':
                case null:
                    return 'TR_REFERRAL_ERROR_GENERIC';
                default:
                    return exhaustive(error.code);
            }
        case 'DeviceCancelled':
            return 'TR_REFERRAL_ERROR_DEVICE_CANCELLED';
        case 'DeviceError':
            return 'TR_REFERRAL_ERROR_DEVICE';
        case 'DeviceNotConnectedError':
            return 'TR_REFERRAL_CONNECT_DESCRIPTION';
        case 'StandardWalletUnavailable':
            return 'TR_REFERRAL_SWITCH_TO_STANDARD_WALLET';
        default:
            return exhaustive(error);
    }
};
