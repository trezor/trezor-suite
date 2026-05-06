import { type MethodPermission, UI_REQUEST } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class GetFirmwareHash extends AbstractMethod<
    'getFirmwareHash',
    PROTO.GetFirmwareHash
> {
    constructor(message: MethodMessage<'getFirmwareHash'>) {
        const { payload } = message;

        Assert(PROTO.GetFirmwareHash, payload);

        const params = { challenge: payload.challenge };

        super(message, params);
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE];
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('GetFirmwareHash', 'FirmwareHash', this.params);

        return response.message;
    }
}
