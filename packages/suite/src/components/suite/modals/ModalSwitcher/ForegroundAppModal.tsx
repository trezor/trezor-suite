import { type ComponentType, type LazyExoticComponent, Suspense, lazy } from 'react';

import { closeModalAppThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import type { ForegroundAppRoute } from 'src/types/suite';

const CreateWalletBackupModal = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ '@suite/backup').then(m => ({
        default: m.CreateWalletBackupModal,
    })),
);
const Backup = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/backup/Backup').then(m => ({
        default: m.Backup,
    })),
);
const FirmwareCustom = lazy(() =>
    import(/* webpackChunkName: "modals-firmware" */ 'src/views/firmware/FirmwareCustom').then(
        m => ({ default: m.FirmwareCustom }),
    ),
);
const FirmwareUpdate = lazy(() =>
    import(/* webpackChunkName: "modals-firmware" */ 'src/views/firmware/FirmwareUpdate').then(
        m => ({ default: m.FirmwareUpdate }),
    ),
);
const Recovery = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/recovery').then(m => ({
        default: m.Recovery,
    })),
);
const BridgeUnavailable = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/suite/bridge').then(m => ({
        default: m.BridgeUnavailable,
    })),
);
const BridgeDeprecated = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/suite/bridge-deprecated').then(
        m => ({ default: m.BridgeDeprecated }),
    ),
);
const BridgeRequested = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/suite/bridge-requested').then(
        m => ({ default: m.BridgeRequested }),
    ),
);
const UdevRules = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/suite/udev').then(m => ({
        default: m.UdevRules,
    })),
);
const Version = lazy(() =>
    import(/* webpackChunkName: "modals-foreground" */ 'src/views/suite/version').then(m => ({
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

// would not work if defined directly in the switch
const FirmwareType = () => <FirmwareUpdate />;

const getForegroundApp = (app: ForegroundAppRoute['app']) => {
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

type ForegroundAppModalProps = {
    app: ForegroundAppRoute['app'];
    cancelable: boolean;
};

/** Modals (foreground applications) initiated by redux state.router.route */
export const ForegroundAppModal = ({ app, cancelable }: ForegroundAppModalProps) => {
    const { dispatch } = useServices(injectDispatch);

    const onCancel = () => dispatch(closeModalAppThunk());

    // check if current route is a "foreground application" marked as isForegroundApp in router config
    // display it above requested physical route (route in url) or as fullscreen app
    // pass common params to "foreground application"
    // every app is dealing with "prerequisites" and other params (like action modals) on they own.
    const ForegroundApp = getForegroundApp(app);

    return (
        ForegroundApp && (
            <Suspense fallback={null}>
                <ForegroundApp cancelable={cancelable} onCancel={onCancel} />
            </Suspense>
        )
    );
};
