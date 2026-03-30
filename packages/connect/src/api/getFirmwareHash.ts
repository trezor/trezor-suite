import { UI_REQUEST } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

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
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
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
