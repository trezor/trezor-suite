import type { ProviderMetadata } from 'invity-api';

export const earnProviderInfo = {
    everstake: {
        logo: 'EVERSTAKE_LOGO',
        name: 'Everstake',
    },
    morpho: {
        logo: 'MORPHO_LOGO',
        name: 'Morpho',
    },
} as const satisfies Record<string, Pick<ProviderMetadata, 'logo' | 'name'>>;

export type EarnProviderId = keyof typeof earnProviderInfo;
