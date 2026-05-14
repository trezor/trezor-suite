import { DEVICE, type MethodPermission, createDeviceMessage } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class SetBusy extends AbstractMethod<'setBusy', PROTO.SetBusy> {
    constructor(message: MethodMessage<'setBusy'>) {
        const { payload } = message;

        const params = { expiry_ms: payload.expiry_ms };

        super(message, params);
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.overridePreviousCall = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall('SetBusy', 'Success', this.params);
        if (this.keepSession && !!this.params.expiry_ms) {
            // NOTE: DEVICE.CHANGED will not be emitted because session is not released
            // change device features and trigger event manually
            // followup: https://github.com/trezor/trezor-suite/issues/6446
            this.getDevice().features.busy = true;
            sendCoreMessage(
                createDeviceMessage(DEVICE.CHANGED, this.getDevice().toMessageObject()),
            );
        }

        return message;
    }
}
