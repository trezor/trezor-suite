import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import type { ForegroundAppRoute } from '#src/types/suite';

/**
 * The foreground apps load on demand. They live in this package because the views they import are
 * reachable only from here; `ForegroundAppModal` renders them from `@suite-app/app`, behind its own
 * `Suspense` boundary, and reaches them through this map rather than through static re-exports,
 * which would pull every view back into the boot bundle.
 *
 * Each app's loader is the literal `import()` its `lazy()` uses, so webpack resolves the two to one
 * chunk and one module promise. Preloading an app therefore leaves its `lazy()` nothing to fetch.
 */
const loadCreateWalletBackupModal = () =>
    import(/* webpackChunkName: "modals-foreground" */ '@suite/backup');
const CreateWalletBackupModal = lazy(() =>
    loadCreateWalletBackupModal().then(m => ({ default: m.CreateWalletBackupModal })),
);

const loadBackup = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/backup/Backup');
const Backup = lazy(() => loadBackup().then(m => ({ default: m.Backup })));

const loadFirmwareCustom = () =>
    import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareCustom');
const FirmwareCustom = lazy(() => loadFirmwareCustom().then(m => ({ default: m.FirmwareCustom })));

const loadFirmwareUpdate = () =>
    import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareUpdate');
const FirmwareUpdate = lazy(() => loadFirmwareUpdate().then(m => ({ default: m.FirmwareUpdate })));

const loadRecovery = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/recovery');
const Recovery = lazy(() => loadRecovery().then(m => ({ default: m.Recovery })));

const loadBridgeUnavailable = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge');
const BridgeUnavailable = lazy(() =>
    loadBridgeUnavailable().then(m => ({ default: m.BridgeUnavailable })),
);

const loadBridgeDeprecated = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-deprecated');
const BridgeDeprecated = lazy(() =>
    loadBridgeDeprecated().then(m => ({ default: m.BridgeDeprecated })),
);

const loadBridgeRequested = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-requested');
const BridgeRequested = lazy(() =>
    loadBridgeRequested().then(m => ({ default: m.BridgeRequested })),
);

const loadUdevRules = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/udev');
const UdevRules = lazy(() => loadUdevRules().then(m => ({ default: m.UdevRules })));

const loadVersion = () =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/version');
const Version = lazy(() => loadVersion().then(m => ({ default: m.Version })));

const loadMultiShareBackupModal = () =>
    import(
        /* webpackChunkName: "modals-foreground" */ '../ReduxModal/UserContextModal/MultiShareBackupModal/MultiShareBackupModal'
    );
const MultiShareBackupModal = lazy(() =>
    loadMultiShareBackupModal().then(m => ({ default: m.MultiShareBackupModal })),
);

type ForegroundAppComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>> | null;

type ForegroundApp = {
    component: ForegroundAppComponent;
    /** `null` where the app has no chunk of its own, so there is nothing to preload. */
    load: (() => Promise<unknown>) | null;
};

// would not work if defined directly in the map
const FirmwareType = () => <FirmwareUpdate />;

const FOREGROUND_APPS: Record<ForegroundAppRoute['app'], ForegroundApp> = {
    firmware: { component: FirmwareUpdate, load: loadFirmwareUpdate },
    'firmware-type': { component: FirmwareType, load: loadFirmwareUpdate },
    'firmware-custom': { component: FirmwareCustom, load: loadFirmwareCustom },
    version: { component: Version, load: loadVersion },
    bridge: { component: BridgeUnavailable, load: loadBridgeUnavailable },
    'bridge-requested': { component: BridgeRequested, load: loadBridgeRequested },
    'bridge-deprecated': { component: BridgeDeprecated, load: loadBridgeDeprecated },
    udev: { component: UdevRules, load: loadUdevRules },
    'switch-device': { component: null, load: null }, // extracted to SwitchDeviceLayer.tsx
    recovery: { component: Recovery, load: loadRecovery },
    backup: { component: Backup, load: loadBackup },
    'create-multi-share-backup': {
        component: MultiShareBackupModal,
        load: loadMultiShareBackupModal,
    },
    'create-wallet-backup': {
        component: CreateWalletBackupModal,
        load: loadCreateWalletBackupModal,
    },
};

export const getForegroundApp = (app: ForegroundAppRoute['app']): ForegroundAppComponent =>
    FOREGROUND_APPS[app].component;

/**
 * Fetches a foreground app's chunk before the navigation that renders it, so an opener that was
 * hovered or tabbed to usually has nothing left to wait for when it is finally clicked.
 *
 * A failed preload is deliberately silent: webpack drops a chunk it could not fetch from its
 * registry, so the navigation requests it again and reports the failure itself.
 */
export const preloadForegroundApp = (app: ForegroundAppRoute['app']) => {
    FOREGROUND_APPS[app].load?.().catch(() => undefined);
};
