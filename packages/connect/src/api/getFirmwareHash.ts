import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { UI } from '../events';
import { getFirmwareRange, validateParams } from './common/paramsValidator';

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

        validateParams(payload, [{ name: 'challenge', type: 'string' }]);

        this.firmwareRange = getFirmwareRange(this.name, null, {
            T1B1: { min: '1.11.1', max: '0' },
            T2T1: { min: '2.5.1', max: '0' },
            T2B1: { min: '2.6.1', max: '0' },
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
