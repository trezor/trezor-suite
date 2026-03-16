import { type ImageType } from '@trezor/components';

type ProviderMetadata = {
    name: string;
    logo: ImageType;
};

export const earnProviderMetadata = {
    everstake: {
        name: 'Everstake',
        logo: 'EVERSTAKE_LOGO',
    },
    morpho: {
        name: 'Morpho',
        logo: 'MORPHO_LOGO',
    },
} as const satisfies Record<string, ProviderMetadata>;

export type EarnProviderId = keyof typeof earnProviderMetadata;
