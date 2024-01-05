import { AbstractMethod } from '../core/AbstractMethod';
import { DEVICE, createDeviceMessage } from '../events';
import { PROTO } from '../constants';
import { getFirmwareRange } from './common/paramsValidator';
import { Assert } from '@trezor/schema-utils';

export default class SetBusy extends AbstractMethod<'setBusy', PROTO.SetBusy> {
    init() {
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];

        const { payload } = this;

        Assert(PROTO.SetBusy, payload);

        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);

        this.params = {
            expiry_ms: payload.expiry_ms,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.typedCall('SetBusy', 'Success', this.params);
        if (this.keepSession && !!this.params.expiry_ms) {
            // NOTE: DEVICE.CHANGED will not be emitted because session is not released
            // change device features and trigger event manually
            // followup: https://github.com/trezor/trezor-suite/issues/6446
            this.device.features.busy = true;
            this.postMessage(createDeviceMessage(DEVICE.CHANGED, this.device.toMessageObject()));
        }

        return message;
    }
}
