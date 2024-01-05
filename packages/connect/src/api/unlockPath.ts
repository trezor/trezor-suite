import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { validatePath } from '../utils/pathUtils';
import { getFirmwareRange } from './common/paramsValidator';
import { Assert } from '@trezor/schema-utils';
import { UnlockPathParams } from '../types/api/unlockPath';

export default class UnlockPath extends AbstractMethod<'unlockPath', PROTO.UnlockPath> {
    init() {
        this.requiredPermissions = ['read'];
        this.skipFinalReload = true;
        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);

        const { payload } = this;

        Assert(UnlockPathParams, payload);
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
