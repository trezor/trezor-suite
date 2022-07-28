import React from 'react';
import { Firmware } from '@firmware-views';
import { FirmwareCustom } from '@firmware-views/FirmwareCustom';
import { Recovery } from '@recovery-views';
import { Backup } from '@backup-views';
import { useActions } from '@suite-hooks';
import { closeModalApp } from '@suite-actions/routerActions';
import { InstallBridge } from '@suite-views/bridge';
import { UdevRules } from '@suite-views/udev';
import { Version } from '@suite-views/version';
import { SwitchDevice } from '@suite-components/SwitchDevice';
import type { ForegroundAppRoute } from '@suite-types';

// would not work if defined directly in the switch
const FirmwareType = () => <Firmware shouldSwitchFirmwareType />;

const getForegroundApp = (app: ForegroundAppRoute['app']) => {
    switch (app) {
        case 'firmware':
            return Firmware;
        case 'firmware-type':
            return FirmwareType;
        case 'firmware-custom':
            return FirmwareCustom;
        case 'bridge':
            return InstallBridge;
        case 'udev':
            return UdevRules;
        case 'version':
            return Version;
        case 'switch-device':
            return SwitchDevice;
        case 'recovery':
            return Recovery;
        case 'backup':
            return Backup;
        default:
            return null;
    }
};

type ForegroundAppModalProps = {
    app: ForegroundAppRoute['app'];
    cancelable: boolean;
};

/** Modals (foreground applications) initiated by redux state.router.route */
export const ForegroundAppModal = ({ app, cancelable }: ForegroundAppModalProps) => {
    const actions = useActions({
        closeModalApp,
    });

    // check if current route is a "foreground application" marked as isForegroundApp in router config
    // display it above requested physical route (route in url) or as fullscreen app
    // pass common params to "foreground application"
    // every app is dealing with "prerequisites" and other params (like action modals) on they own.
    const ForegroundApp = getForegroundApp(app);
    return (
        ForegroundApp && <ForegroundApp cancelable={cancelable} onCancel={actions.closeModalApp} />
    );
};
