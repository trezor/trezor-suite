import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
import { getFirmwareRange } from './common/paramsValidator';
import { CancelCoinjoinAuthorization as CancelCoinjoinAuthorizationSchema } from '../types/api/cancelCoinjoinAuthorization';

export default class CancelCoinjoinAuthorization extends AbstractMethod<
    'cancelCoinjoinAuthorization',
    PROTO.CancelAuthorization
> {
    constructor(message: { id?: number; payload: Payload<'cancelCoinjoinAuthorization'> }) {
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

    async run(device: Device) {
        const cmd = device.getCommands();

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
