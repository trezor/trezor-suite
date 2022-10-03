import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { getFirmwareRange, validateParams } from './common/paramsValidator';

export default class SetBusy extends AbstractMethod<'setBusy', PROTO.SetBusy> {
    init() {
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.keepSession = true; // TODO: device-changed will not be emitted. followup: https://github.com/trezor/trezor-suite/issues/6446

        const { payload } = this;

        validateParams(payload, [{ name: 'expiry_ms', type: 'number' }]);

        this.firmwareRange = getFirmwareRange(this.name, null, {
            1: { min: '0', max: '0' },
            2: { min: '2.5.3', max: '0' },
        });

        this.params = {
            expiry_ms: payload.expiry_ms,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SetBusy', 'Success', this.params);
        return message;
    }
}
