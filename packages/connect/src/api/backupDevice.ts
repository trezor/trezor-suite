// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BackupDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI, createUiMessage } from '../events';

export default class BackupDevice extends AbstractMethod<'backupDevice'> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
    }

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                customConfirmButton: {
                    className: 'confirm',
                    label: 'Proceed',
                },
                label: 'Do you want to initiate backup procedure?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        return uiResp.payload;
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('BackupDevice', 'Success');

        return response.message;
    }
}
