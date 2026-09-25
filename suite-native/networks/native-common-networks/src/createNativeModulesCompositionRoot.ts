import type { SuiteNativeNetworkModule } from '@suite-native/network-module-suite-native-types';
import { createSolanaNativeNetworkModule } from '@suite-native/network-solana';
import { type MMKVStorageDep } from '@suite-native/storage';

export type NativeNetworkModules = readonly SuiteNativeNetworkModule[];

type NativeModulesCompositionRootDeps = MMKVStorageDep;

export const createNativeModulesCompositionRoot = (
    deps: NativeModulesCompositionRootDeps,
): NativeNetworkModules => {
    const solana = createSolanaNativeNetworkModule({
        mmkvStorage: deps.mmkvStorage,
    });

    return [solana];
};
