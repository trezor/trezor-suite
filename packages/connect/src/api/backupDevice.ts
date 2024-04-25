// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BackupDevice.js

import { AbstractMethod } from '../core/AbstractMethod';

export default class BackupDevice extends AbstractMethod<'backupDevice'> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you want to initiate backup procedure?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('BackupDevice', 'Success');

        return response.message;
    }
}
