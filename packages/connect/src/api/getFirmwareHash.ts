import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { Assert } from '@trezor/schema-utils';

export default class GetFirmwareHash extends AbstractMethod<
    'getFirmwareHash',
    PROTO.GetFirmwareHash
> {
    init() {
        this.requiredPermissions = ['management'];
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI.INITIALIZE];

        const { payload } = this;

        Assert(PROTO.GetFirmwareHash, payload);

        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        this.params = {
            challenge: payload.challenge,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('GetFirmwareHash', 'FirmwareHash', this.params);

        return response.message;
    }
}
