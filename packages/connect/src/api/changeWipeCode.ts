import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';

export default class ChangeWipeCode extends AbstractMethod<'changeWipeCode', PROTO.ChangeWipeCode> {
    constructor(message: { id?: number; payload: Payload<'changeWipeCode'> }) {
        super(message);
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;
        validateParams(payload, [{ name: 'remove', type: 'boolean' }]);

        this.params = {
            remove: payload.remove,
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('ChangeWipeCode', 'Success', this.params);

        return response.message;
    }
}
