import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';

export default class ChangeWipeCode extends AbstractMethod<'changeWipeCode', PROTO.ChangeWipeCode> {
    constructor(message: MethodMessage<'changeWipeCode'>) {
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
