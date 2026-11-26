import { type ComponentType, type LazyExoticComponent } from 'react';

import { lazyComponentByName } from '@trezor/lazy-loading';

import type { ForegroundAppRoute } from '#src/types/suite';

/** A foreground app, with the `preload` of the `import()` its boundary awaits, or `null`. */
type ForegroundApp = {
    LazyComponent: LazyExoticComponent<ComponentType<any>>;
    preload: () => void;
} | null;

/**
 * Reached through this map rather than static re-exports, which would pull every view back into
 * the boot bundle. `ForegroundAppModal` renders them behind its own `Suspense` boundary.
 */
const FOREGROUND_APPS = {
    firmware: lazyComponentByName(
        () =>
            import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareUpdate'),
        'FirmwareUpdate',
    ),
    /**
     * Declared again rather than aliasing `firmware`: two routes resolving to the same component
     * would keep the mounted instance across a change between them. Same `import()`, same chunk.
     */
    'firmware-type': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareUpdate'),
        'FirmwareUpdate',
    ),
    'firmware-custom': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareCustom'),
        'FirmwareCustom',
    ),
    version: lazyComponentByName(
        () =>
            import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/version/Version'),
        'Version',
    ),
    bridge: lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge/BridgeUnavailable'
            ),
        'BridgeUnavailable',
    ),
    'bridge-requested': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-requested/BridgeRequested'
            ),
        'BridgeRequested',
    ),
    'bridge-deprecated': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-deprecated/BridgeDeprecated'
            ),
        'BridgeDeprecated',
    ),
    udev: lazyComponentByName(
        () => import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/udev/UdevRules'),
        'UdevRules',
    ),
    'switch-device': null, // extracted to SwitchDeviceLayer.tsx
    recovery: lazyComponentByName(
        () => import(/* webpackChunkName: "modals-foreground" */ '#src/views/recovery/Recovery'),
        'Recovery',
    ),
    backup: lazyComponentByName(
        () => import(/* webpackChunkName: "modals-foreground" */ '#src/views/backup/Backup'),
        'Backup',
    ),
    'create-multi-share-backup': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "modals-foreground" */ '../ReduxModal/UserContextModal/MultiShareBackupModal/MultiShareBackupModal'
            ),
        'MultiShareBackupModal',
    ),
    /** `webpackExports` because `@suite/backup` is a barrel: a runtime key picks the export. */
    'create-wallet-backup': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "modals-foreground", webpackExports: ["CreateWalletBackupModal"] */ '@suite/backup'
            ),
        'CreateWalletBackupModal',
    ),
} as const satisfies Record<ForegroundAppRoute['app'], ForegroundApp>;

export const getForegroundApp = (app: ForegroundAppRoute['app']) =>
    FOREGROUND_APPS[app]?.LazyComponent ?? null;

/** Fetches an app's chunk before the navigation that renders it. */
export const preloadForegroundApp = (app: ForegroundAppRoute['app']) => {
    FOREGROUND_APPS[app]?.preload();
};
