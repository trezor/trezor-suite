import type {
    GetCryptoIconDep,
    GetNetworkIconDep,
    GetTokenLogoIdentifiersDep,
    HasCryptoIconDep,
    HasNetworkIconDep,
} from '@trezor/network-assets-types';

import type { ProductComponentsServices } from './ProductComponentsServices';

export const injectGetCryptoIcon = (services: ProductComponentsServices): GetCryptoIconDep => ({
    getCryptoIcon: services.networks.networkIcon.getCryptoIcon,
});
export const injectGetNetworkIcon = (services: ProductComponentsServices): GetNetworkIconDep => ({
    getNetworkIcon: services.networks.networkIcon.getNetworkIcon,
});
export const injectHasCryptoIcon = (services: ProductComponentsServices): HasCryptoIconDep => ({
    hasCryptoIcon: services.networks.networkIcon.hasCryptoIcon,
});
export const injectHasNetworkIcon = (services: ProductComponentsServices): HasNetworkIconDep => ({
    hasNetworkIcon: services.networks.networkIcon.hasNetworkIcon,
});
export const injectIsWrappedNativeToken = (services: ProductComponentsServices) => ({
    isWrappedNativeToken: services.networks.isWrappedNativeToken,
});
export const injectGetTokenLogoIdentifiers = (
    services: ProductComponentsServices,
): GetTokenLogoIdentifiersDep => ({
    getTokenLogoIdentifiers: services.networks.networkIcon.getTokenLogoIdentifiers,
});
