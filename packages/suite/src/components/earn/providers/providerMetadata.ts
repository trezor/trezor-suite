import {
    EARN_PROVIDERS,
    type EarnProviderId as RegistryEarnProviderId,
} from '@suite-common/wallet-config';
import { type ImageType } from '@trezor/components';

type ProviderMetadata = {
    name: string;
    companyName: string;
    logo: ImageType;
};

const PROVIDER_LOGOS = {
    everstake: 'EVERSTAKE_LOGO',
    morpho: 'MORPHO_LOGO',
} as const satisfies Partial<Record<RegistryEarnProviderId, ImageType>>;

export type EarnProviderId = keyof typeof PROVIDER_LOGOS;

const toProviderMetadata = (id: EarnProviderId): ProviderMetadata => {
    const { name, companyName } = EARN_PROVIDERS[id];

    return { name, companyName, logo: PROVIDER_LOGOS[id] };
};

export const EARN_PROVIDER_METADATA: Readonly<Record<EarnProviderId, ProviderMetadata>> = {
    everstake: toProviderMetadata('everstake'),
    morpho: toProviderMetadata('morpho'),
};
