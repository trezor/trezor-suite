import { type EarnProviderId } from '@suite-common/wallet-config';
import { type ImageType } from '@trezor/components';

export const EARN_PROVIDER_LOGOS = {
    everstake: 'EVERSTAKE_LOGO',
    morpho: 'MORPHO_LOGO',
} as const satisfies Partial<Record<EarnProviderId, ImageType>>;

export type EarnProviderWithLogo = keyof typeof EARN_PROVIDER_LOGOS;
