import type { ProductComponentsServices } from './ProductComponentsServices';

export const injectGetCryptoIcon = (services: ProductComponentsServices) => ({
    getCryptoIcon: services.networks.networkIcon.getCryptoIcon,
});
export const injectGetNetworkIcon = (services: ProductComponentsServices) => ({
    getNetworkIcon: services.networks.networkIcon.getNetworkIcon,
});
export const injectHasCryptoIcon = (services: ProductComponentsServices) => ({
    hasCryptoIcon: services.networks.networkIcon.hasCryptoIcon,
});
export const injectHasNetworkIcon = (services: ProductComponentsServices) => ({
    hasNetworkIcon: services.networks.networkIcon.hasNetworkIcon,
});
export const injectIsTestnetNetworkIcon = (services: ProductComponentsServices) => ({
    isTestnetNetworkIcon: services.networks.networkIcon.isTestnetNetworkIcon,
});
export const injectIsWrappedNativeToken = (services: ProductComponentsServices) => ({
    isWrappedNativeToken: services.networks.networkIcon.isWrappedNativeToken,
});
export const injectGetTokenLogoIdentifiers = (services: ProductComponentsServices) => ({
    getTokenLogoIdentifiers: services.networks.networkIcon.getTokenLogoIdentifiers,
});
