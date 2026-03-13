import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validatePath } from '../utils/pathUtils';
import { getFirmwareRange } from './common/paramsValidator';
import { UnlockPathParams } from '../types/api/unlockPath';

export default class UnlockPath extends AbstractMethod<'unlockPath', PROTO.UnlockPath> {
    constructor(message: { id?: number; payload: Payload<'unlockPath'> }) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;

        Assert(UnlockPathParams, payload);
        const path = validatePath(payload.path, 1);

        this.params = {
            address_n: path,
            mac: payload.mac,
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.unlockPath(this.params);

        return {
            address_n: this.params.address_n,
            mac: message.mac,
        };
    }
}
