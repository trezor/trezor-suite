import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { validatePath } from '../utils/pathUtils';
import { getFirmwareRange, validateParams } from './common/paramsValidator';

export default class UnlockPath extends AbstractMethod<'unlockPath', PROTO.UnlockPath> {
    init() {
        this.requiredPermissions = ['read'];
        this.skipFinalReload = true;
        this.firmwareRange = getFirmwareRange(this.name, null, {
            1: { min: '1.12.1', max: '0' },
            2: { min: '2.5.3', max: '0' },
        });

        const { payload } = this;

        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'mac', type: 'string' },
        ]);
        const path = validatePath(payload.path, 1);

        this.params = {
            address_n: path,
            mac: payload.mac,
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const { message } = await cmd.unlockPath(this.params);
        return {
            address_n: this.params.address_n,
            mac: message.mac,
        };
    }
}
