import { createNativeSecureStorage } from '@suite-common/secure-storage-native';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/wallet-core';
import { createSuiteSyncNativeCompositionRoot } from '@suite-native/suite-sync';
import TrezorConnect from '@trezor/connect';

type Deps = {
    getState: () => any;
    dispatch: any;
};

export const nativeCompositionRoot = (deps: Deps) => {
    const secureStorage = createNativeSecureStorage();
    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        ...deps,
        secureStorage,
        trezorConnect: TrezorConnect,
    });

    return {
        services: {
            suiteSync: createSuiteSyncNativeCompositionRoot({
                ...deps,
                secureStorage,
                trezorConnect: TrezorConnect,
                ensureDelegatedIdentityKey,
            }),
            secureStorage,
        },
    };
};

export type NativeAppServices = ReturnType<typeof nativeCompositionRoot>;
