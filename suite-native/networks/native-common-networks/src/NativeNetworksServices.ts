import type { NetworkSymbol } from '@suite-common/networks';
import type {
    NativeNetworkAccountDetailBanners,
    NativeNetworkSendFormComponent,
} from '@suite-native/network-module-suite-native-types';

export type NativeNetworksServices = {
    getSendForm: (networkSymbol: NetworkSymbol) => NativeNetworkSendFormComponent | undefined;
    getAccountDetailBanners: (networkSymbol: NetworkSymbol) => NativeNetworkAccountDetailBanners;
};

export type NativeNetworksDep = {
    nativeNetworks: NativeNetworksServices;
};

export const injectNativeNetworks = (services: any): NativeNetworksDep => ({
    nativeNetworks: services.nativeNetworks,
});
