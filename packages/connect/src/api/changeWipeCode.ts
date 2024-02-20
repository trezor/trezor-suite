import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import type { PROTO } from '../constants';

export default class ChangeWipeCode extends AbstractMethod<'changeWipeCode', PROTO.ChangeWipeCode> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;
        validateParams(payload, [{ name: 'remove', type: 'boolean' }]);

        this.params = {
            remove: payload.remove,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ChangeWipeCode', 'Success', this.params);

        return response.message;
    }
}
