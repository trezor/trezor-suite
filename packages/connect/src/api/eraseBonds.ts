// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplyFlags.js

import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';

export default class EraseBonds extends AbstractMethod<
    'eraseBonds',
    PROTO.EraseBonds & { current?: boolean }
> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        this.skipFinalReload = true;

        const { payload } = this;
        this.params = {
            // TODO: which should be default? all or current?
            current: false, // payload.current
        };

        Assert(PROTO.EraseBonds, payload);
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall(
            this.params.current ? 'Unpair' : 'EraseBonds',
            'Success',
            {},
        );

        return response.message;
    }
}
