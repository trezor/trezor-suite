import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';

export default class BleUnpair extends AbstractMethod<'bleUnpair', PROTO.BleUnpair> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        this.skipFinalReload = true;

        const { payload } = this;
        this.params = {
            all: payload.all,
        };

        Assert(PROTO.BleUnpair, payload);
    }

    async run() {
        const cmd = this.device.getCommands();
        // unpair current bluetooth connection session or all known sessions
        const response = await cmd.typedCall('BleUnpair', 'Success', this.params);

        return response.message;
    }
}
