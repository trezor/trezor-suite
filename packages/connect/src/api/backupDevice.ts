// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BackupDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

export default class BackupDevice extends AbstractMethod<'backupDevice', PROTO.BackupDevice> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        Assert(PROTO.BackupDevice, payload);

        this.params = {
            group_threshold: payload.group_threshold,
            groups: payload.groups,
        };
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
        const response = await cmd.typedCall('BackupDevice', 'Success', this.params);

        return response.message;
    }
}
