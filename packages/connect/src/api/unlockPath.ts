import { UnlockPathParams } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validatePath } from '../utils/pathUtils';
import { getFirmwareRange } from './common/paramsValidator';

export default class UnlockPath extends AbstractMethod<'unlockPath', PROTO.UnlockPath> {
    constructor(message: MethodMessage<'unlockPath'>) {
        const { payload } = message;

        Assert(UnlockPathParams, payload);
        const path = validatePath(payload.path, 1);

        const params = {
            address_n: path,
            mac: payload.mac,
        };

        super(message, params);
        this.firmwareRange = getFirmwareRange(this.name, undefined, this.firmwareRange);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
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
