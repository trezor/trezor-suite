import { type GetAssetLogoUrlParams } from '@trezor/asset-utils';
import { type ImageType } from '@trezor/components';

type ProviderMetadata = {
    name: string;
    companyName: string;
    logo: ImageType;
    tokenLogo?: Required<Pick<GetAssetLogoUrlParams, 'coingeckoId' | 'contractAddress'>>;
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
        tokenLogo: {
            coingeckoId: 'ethereum',
            contractAddress: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
        },
    },
} as const satisfies Record<string, ProviderMetadata>;

export type EarnProviderId = keyof typeof EARN_PROVIDER_METADATA;
