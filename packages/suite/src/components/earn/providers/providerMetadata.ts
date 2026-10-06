import { type ImageType } from '@trezor/components';

type ProviderMetadata = {
    name: string;
    companyName: string;
    logo: ImageType;
};

export const EARN_PROVIDER_METADATA = {
    everstake: {
        name: 'Everstake',
        companyName: 'Everstake',
        logo: 'EVERSTAKE_LOGO',
    },
    morpho: {
        name: 'Morpho',
        companyName: 'Morpho',
        logo: 'MORPHO_LOGO',
    },
} as const satisfies Record<string, ProviderMetadata>;

export type EarnProviderId = keyof typeof EARN_PROVIDER_METADATA;
