import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { isWhitelistedHost } from '@trezor/utils';
import { z } from '@trezor/zod';

const REFER_A_FRIEND_ALLOWED_HOSTS = ['localhost', 'trezor.io', 'sldev.cz'];

// The API sends uppercase ISO codes, while the supported base currencies are keyed in lowercase.
const isSupportedFiatCurrency = (fiatCurrency: string) =>
    isFiatBaseCurrencyCode(fiatCurrency.toLowerCase());

const isTrezorTermsUrl = (termsUrl: string) => {
    try {
        const { protocol, hostname } = new URL(termsUrl);

        return protocol === 'https:' && isWhitelistedHost(hostname, REFER_A_FRIEND_ALLOWED_HOSTS);
    } catch {
        return false;
    }
};

export const referralProgramSchema = z.object({
    fiatCurrency: z.string().refine(isSupportedFiatCurrency),
    rewardAmount: z.number().nonnegative(),
    friendDiscountPercentage: z.number().nonnegative(),
    minimumOrderAmount: z.number().nonnegative(),
    redemptionLimit: z.number().nonnegative(),
    termsUrl: z.string().refine(isTrezorTermsUrl),
});

export type ReferralProgram = z.infer<typeof referralProgramSchema>;

const inactiveReferralAccountSchema = z.object({
    status: z.enum(['none', 'left']),
    joinedAt: z.null(),
    code: z.null(),
    shareUrl: z.null(),
    redemptionCount: z.null(),
    redemptionLimit: z.null(),
    redemptionLimitResetsAt: z.null(),
});

const activeReferralAccountSchema = z.object({
    status: z.literal('active'),
    joinedAt: z.string(),
    code: z.string(),
    shareUrl: z.string(),
    redemptionCount: z.number().nonnegative(),
    redemptionLimit: z.number().nonnegative(),
    // Expected to be defined only when the user is at their redemptions limit.
    redemptionLimitResetsAt: z.string().nullable(),
});

export const referralAccountSchema = z.discriminatedUnion('status', [
    inactiveReferralAccountSchema,
    activeReferralAccountSchema,
]);

export type ReferralAccount = z.infer<typeof referralAccountSchema>;
export type ReferralAccountStatus = ReferralAccount['status'];

const referralVoucherBaseSchema = z.object({
    // The API sends the amount as a decimal string, e.g. "20.00".
    // The schema parses it to number internally during validation, so that the type is simple in suite code.
    amount: z
        .union([z.number(), z.string()])
        .pipe(z.coerce.number<number | string>().nonnegative()),
    fiatCurrency: z.string(),
    orderPaidAt: z.string(),
    availableAt: z.string(),
});

const pendingReferralVoucherSchema = referralVoucherBaseSchema.extend({
    status: z.literal('pending'),
    code: z.null(),
    expiresAt: z.null(),
    usedAt: z.null(),
});

const unusedReferralVoucherSchema = referralVoucherBaseSchema.extend({
    status: z.enum(['available', 'expired', 'canceled']),
    code: z.string(),
    expiresAt: z.string(),
    usedAt: z.null(),
});

const usedReferralVoucherSchema = referralVoucherBaseSchema.extend({
    status: z.literal('used'),
    code: z.string(),
    expiresAt: z.string(),
    usedAt: z.string(),
});

const referralVoucherSchema = z.discriminatedUnion('status', [
    pendingReferralVoucherSchema,
    unusedReferralVoucherSchema,
    usedReferralVoucherSchema,
]);

export type ReferralVoucher = z.infer<typeof referralVoucherSchema>;
export type ReferralVoucherStatus = ReferralVoucher['status'];

export const referralVouchersResponseSchema = z.object({
    vouchers: z.array(referralVoucherSchema),
});
