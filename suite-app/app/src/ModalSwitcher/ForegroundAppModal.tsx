import { type FunctionComponent } from 'react';

import { CreateWalletBackupModal } from '@suite/backup';
import { closeModalAppThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import {
    Backup,
    BridgeDeprecated,
    BridgeRequested,
    BridgeUnavailable,
    FirmwareCustom,
    FirmwareUpdate,
    type ForegroundAppRoute,
    MultiShareBackupModal,
    Recovery,
    UdevRules,
    Version,
} from '@trezor/suite';

// would not work if defined directly in the switch
const FirmwareType = () => <FirmwareUpdate />;

const getForegroundApp = (app: ForegroundAppRoute['app']) => {
    const map: Record<ForegroundAppRoute['app'], FunctionComponent<any> | null> = {
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

    return ForegroundApp && <ForegroundApp cancelable={cancelable} onCancel={onCancel} />;
};
