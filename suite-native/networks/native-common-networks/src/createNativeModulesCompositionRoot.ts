import { createBitcoinNativeNetworkModule } from '@suite-native/network-bitcoin';
import type { SuiteNativeNetworkModule } from '@suite-native/network-module-suite-native-types';
import { createRippleNativeNetworkModule } from '@suite-native/network-ripple';
import { createSolanaNativeNetworkModule } from '@suite-native/network-solana';
import { type MMKVStorageDep } from '@suite-native/storage';

export type NativeNetworkModules = readonly SuiteNativeNetworkModule[];

type NativeModulesCompositionRootDeps = MMKVStorageDep;

export const createNativeModulesCompositionRoot = (
    deps: NativeModulesCompositionRootDeps,
): NativeNetworkModules => {
    const bitcoin = createBitcoinNativeNetworkModule();
    const ripple = createRippleNativeNetworkModule();
    const solana = createSolanaNativeNetworkModule({
        mmkvStorage: deps.mmkvStorage,
    });

    return [bitcoin, ripple, solana];
};
