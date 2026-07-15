import { type PermissionRequest } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage } from '../core/AbstractMethod';
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
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall('SetBusy', 'Success', this.params);
        if (this.keepSession && !!this.params.expiry_ms) {
            // session is kept, so no session change will emit DEVICE.CHANGED automatically;
            // change the feature and emit the change ourselves
            this.getDevice().features.busy = true;
            this.getDevice().emitDeviceChanged();
        }

        return message;
    }
}
