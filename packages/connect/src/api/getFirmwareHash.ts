import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
import { UI_REQUEST } from '../events';
import { getFirmwareRange } from './common/paramsValidator';

export default class GetFirmwareHash extends AbstractMethod<
    'getFirmwareHash',
    PROTO.GetFirmwareHash
> {
    constructor(message: { id?: number; payload: Payload<'getFirmwareHash'> }) {
        super(message);
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.GetFirmwareHash, payload);

        this.params = {
            challenge: payload.challenge,
        };
    }

    async run(device: Device) {
        const cmd = device.getCommands();
        const response = await cmd.typedCall('GetFirmwareHash', 'FirmwareHash', this.params);

        return response.message;
    }
}
