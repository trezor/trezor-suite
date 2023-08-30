import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { UI } from '../events';
import { getFirmwareRange, validateParams } from './common/paramsValidator';

export default class GetFirmwareHash extends AbstractMethod<
    'getFirmwareHash',
    PROTO.GetFirmwareHash
> {
    async init() {
        this.requiredPermissions = ['management'];
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI.INITIALIZE];

        const { payload } = this;

        validateParams(payload, [{ name: 'challenge', type: 'string' }]);

        this.firmwareRange = getFirmwareRange(this.name, null, {
            1: { min: '1.11.1', max: '0' },
            2: { min: '2.5.1', max: '0' },
        });

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
