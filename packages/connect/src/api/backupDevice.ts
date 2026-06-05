// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BackupDevice.js

import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class BackupDevice extends AbstractMethod<'backupDevice', PROTO.BackupDevice> {
    constructor(message: MethodMessage<'backupDevice'>) {
        const { payload } = message;

        Assert(PROTO.BackupDevice, payload);

        const params = {
            group_threshold: payload.group_threshold,
            groups: payload.groups,
            backup_method: payload.backup_method,
        };

        super(message, params);
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
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
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('BackupDevice', 'Success', this.params);

        return response.message;
    }
}
