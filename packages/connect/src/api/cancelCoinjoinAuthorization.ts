import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';
import { CancelCoinjoinAuthorization as CancelCoinjoinAuthorizationSchema } from '../types/api/cancelCoinjoinAuthorization';

export default class CancelCoinjoinAuthorization extends AbstractMethod<
    'cancelCoinjoinAuthorization',
    PROTO.CancelAuthorization
> {
    init() {
        const { payload } = this;

        Assert(CancelCoinjoinAuthorizationSchema, payload);

        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.preauthorized =
            typeof payload.preauthorized === 'boolean' ? payload.preauthorized : true;
    }

    get info() {
        return 'Cancel Coinjoin Authorization';
    }

    async run() {
        const cmd = this.device.getCommands();

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
