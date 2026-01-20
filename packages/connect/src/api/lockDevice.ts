import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class LockDevice extends AbstractMethod<'lockDevice', PROTO.LockDevice> {
    init() {
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.skipFinalReload = true;

        const { payload } = this;

        Assert(PROTO.LockDevice, payload);

        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);

        this.params = {};
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('LockDevice', 'Success', this.params);

        return message;
    }
}
