import { type PermissionRequest, UI_REQUEST } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class PingDevice extends AbstractMethod<'pingDevice', PROTO.Ping> {
    constructor(message: MethodMessage<'pingDevice'>) {
        const { payload } = message;
        // validate incoming parameters
        Assert(PROTO.Ping, payload);

        const params = {
            message: payload.message,
            button_protection: payload.button_protection,
        };

        super(message, params);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS, UI_REQUEST.BOOTLOADER];
        this.useDeviceState = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('Ping', 'Success', this.params);

        return response.message;
    }
}
