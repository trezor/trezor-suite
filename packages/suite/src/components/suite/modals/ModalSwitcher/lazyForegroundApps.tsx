import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import type { ForegroundAppRoute } from '#src/types/suite';

/**
 * The foreground apps load on demand. They live in this package because the views they import are
 * reachable only from here; `ForegroundAppModal` renders them from `@suite-app/app`, behind its own
 * `Suspense` boundary, and reaches them through this map rather than through static re-exports,
 * which would pull every view back into the boot bundle.
 */
const CreateWalletBackupModal = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '@suite/backup').then(m => ({
        default: m.CreateWalletBackupModal,
    })),
);
const Backup = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/backup/Backup').then(m => ({
        default: m.Backup,
    })),
);
const FirmwareCustom = lazy(() =>
    import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareCustom').then(
        m => ({ default: m.FirmwareCustom }),
    ),
);
const FirmwareUpdate = lazy(() =>
    import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareUpdate').then(
        m => ({ default: m.FirmwareUpdate }),
    ),
);
const Recovery = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/recovery').then(m => ({
        default: m.Recovery,
    })),
);
const BridgeUnavailable = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge').then(m => ({
        default: m.BridgeUnavailable,
    })),
);
const BridgeDeprecated = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-deprecated').then(
        m => ({ default: m.BridgeDeprecated }),
    ),
);
const BridgeRequested = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/bridge-requested').then(
        m => ({ default: m.BridgeRequested }),
    ),
);
const UdevRules = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/udev').then(m => ({
        default: m.UdevRules,
    })),
);
const Version = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '#src/views/suite/version').then(m => ({
        default: m.Version,
    })),
);
const MultiShareBackupModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-foreground" */ '../ReduxModal/UserContextModal/MultiShareBackupModal/MultiShareBackupModal'
    ).then(m => ({
        default: m.MultiShareBackupModal,
    })),
);

type ForegroundAppComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>> | null;

// would not work if defined directly in the map
const FirmwareType = () => <FirmwareUpdate />;

export const getForegroundApp = (app: ForegroundAppRoute['app']): ForegroundAppComponent => {
    const map: Record<ForegroundAppRoute['app'], ForegroundAppComponent> = {
        firmware: FirmwareUpdate,
        'firmware-type': FirmwareType,
        'firmware-custom': FirmwareCustom,
        version: Version,
        bridge: BridgeUnavailable,
        'bridge-requested': BridgeRequested,
        'bridge-deprecated': BridgeDeprecated,
        udev: UdevRules,
        'switch-device': null, // extracted to SwitchDeviceLayer.tsx
        recovery: Recovery,
        backup: Backup,
        'create-multi-share-backup': MultiShareBackupModal,
        'create-wallet-backup': CreateWalletBackupModal,
    };

    return map[app];
};
