import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO } from '../constants';

export default class CancelCoinjoinAuthorization extends AbstractMethod<
    'cancelCoinjoinAuthorization',
    PROTO.CancelAuthorization
> {
    async init() {
        const { payload } = this;

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
