// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplyFlags.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class ApplyFlags extends AbstractMethod<'applyFlags', PROTO.ApplyFlags> {
    constructor(message: MethodMessage<'applyFlags'>) {
        super(message);
        this.useDeviceState = false;
        this.skipFinalReload = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.ApplyFlags, payload);

        this.params = {
            flags: payload.flags,
        };
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you really want to apply flags?',
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('ApplyFlags', 'Success', this.params);

        return response.message;
    }
}
