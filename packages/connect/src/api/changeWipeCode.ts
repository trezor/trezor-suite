import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';

export default class ChangeWipeCode extends AbstractMethod<'changeWipeCode', PROTO.ChangeWipeCode> {
    constructor(message: MethodMessage<'changeWipeCode'>) {
        const { payload } = message;
        validateParams(payload, [{ name: 'remove', type: 'boolean' }]);

        const params = { remove: payload.remove };

        super(message, params);
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('ChangeWipeCode', 'Success', this.params);

        return response.message;
    }
}
