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
