import type { NetworkSymbol } from '@suite-common/networks';
import type {
    NativeNetworkAccountDetailBanners,
    NativeNetworkSendModule,
} from '@suite-native/network-module-suite-native-types';

export type NativeNetworksServices = {
    /** The network's send declaration, strategy and slot components; undefined when it has no send form. */
    getSend: (networkSymbol: NetworkSymbol) => NativeNetworkSendModule | undefined;
    getAccountDetailBanners: (networkSymbol: NetworkSymbol) => NativeNetworkAccountDetailBanners;
};

export type NativeNetworksDep = {
    nativeNetworks: NativeNetworksServices;
};

export const injectNativeNetworks = (services: any): NativeNetworksDep => ({
    nativeNetworks: services.nativeNetworks,
});
