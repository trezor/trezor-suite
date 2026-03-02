import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
import { DEVICE, createDeviceMessage } from '../events';
import { getFirmwareRange } from './common/paramsValidator';

export default class SetBusy extends AbstractMethod<'setBusy', PROTO.SetBusy> {
    constructor(message: { id?: number; payload: Payload<'setBusy'> }) {
        super(message);
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.overridePreviousCall = true;
        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        this.params = {
            expiry_ms: payload.expiry_ms,
        };
    }

    async run(device: Device) {
        const cmd = device.getCommands();
        const { message } = await cmd.typedCall('SetBusy', 'Success', this.params);
        if (this.keepSession && !!this.params.expiry_ms) {
            // NOTE: DEVICE.CHANGED will not be emitted because session is not released
            // change device features and trigger event manually
            // followup: https://github.com/trezor/trezor-suite/issues/6446
            device.features.busy = true;
            this.postMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
        }

        return message;
    }
}
