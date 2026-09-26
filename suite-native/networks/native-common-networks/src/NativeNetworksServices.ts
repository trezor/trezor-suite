import type { NetworkSymbol } from '@suite-common/networks';
import type { NativeNetworkAccountDetailBanners } from '@suite-native/network-module-suite-native-types';

export type { NativeNetworkAccountDetailBannerProps } from '@suite-native/network-module-suite-native-types';

export type NativeNetworksServices = {
    getAccountDetailBanners: (networkSymbol: NetworkSymbol) => NativeNetworkAccountDetailBanners;
};

export type NativeNetworksDep = {
    nativeNetworks: NativeNetworksServices;
};

export const injectNativeNetworks = (services: any): NativeNetworksDep => ({
    nativeNetworks: services.nativeNetworks,
});
