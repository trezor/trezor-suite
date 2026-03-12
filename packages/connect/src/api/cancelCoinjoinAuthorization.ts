import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { CancelCoinjoinAuthorization as CancelCoinjoinAuthorizationSchema } from '../types/api/cancelCoinjoinAuthorization';

export default class CancelCoinjoinAuthorization extends AbstractMethod<
    'cancelCoinjoinAuthorization',
    PROTO.CancelAuthorization
> {
    constructor(message: MethodMessage<'cancelCoinjoinAuthorization'>) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(CancelCoinjoinAuthorizationSchema, payload);
        this.preauthorized =
            typeof payload.preauthorized === 'boolean' ? payload.preauthorized : true;
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
