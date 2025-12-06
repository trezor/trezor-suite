import { createElectronSecureStorage } from '@suite/secure-storage-electron';
import { createWebauthnSecureStorage } from '@suite/secure-storage-webauthn';
import { createSuiteSyncDesktopCompositionRoot } from '@suite/suite-sync';
import { delegatedIdentityKeyCompositionRoot } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

type Deps = {
    getState: () => any;
    dispatch: any;
};

export const suiteCompositionRoot = (deps: Deps) => {
    const secureStorage = isDesktop()
        ? createElectronSecureStorage({ desktopApi })
        : createWebauthnSecureStorage();

    const { ensureDelegatedIdentityKey } = delegatedIdentityKeyCompositionRoot({
        ...deps,
        secureStorage,
        trezorConnect: TrezorConnect,
    });

    return {
        suiteSync: createSuiteSyncDesktopCompositionRoot({
            ...deps,
            secureStorage,
            trezorConnect: TrezorConnect,
            ensureDelegatedIdentityKey,
        }),
        secureStorage,
    };
};

export type SuiteAppServices = ReturnType<typeof suiteCompositionRoot>;
