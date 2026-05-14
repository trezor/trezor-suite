import {
    CancelCoinjoinAuthorization as CancelCoinjoinAuthorizationSchema,
    type MethodPermission,
} from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class CancelCoinjoinAuthorization extends AbstractMethod<'cancelCoinjoinAuthorization'> {
    constructor(message: MethodMessage<'cancelCoinjoinAuthorization'>) {
        const { payload } = message;

        Assert(CancelCoinjoinAuthorizationSchema, payload);

        super(message, undefined);
        this.preauthorized =
            typeof payload.preauthorized === 'boolean' ? payload.preauthorized : true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Cancel Coinjoin Authorization';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        if (!this.preauthorized) {
            if (!(await cmd.preauthorize(false))) {
                // device is not preauthorised
                return { message: 'Not authorized' };
            }
        }

        const response = await cmd.typedCall('CancelAuthorization', 'Success');

        return response.message;
    }
}
