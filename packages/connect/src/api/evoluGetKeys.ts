import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';

export default class EvoluGetKeys extends AbstractMethod<'evoluGetKeys', PROTO.EvoluGetKeys> {
    hasBundle?: boolean;

    init() {
        const { payload } = this;

        Assert(PROTO.EvoluGetKeys, payload);

        this.params = {};
    }

    get info() {
        return 'Evolu get keys';
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('EvoluGetKeys', 'EvoluKeys', this.params);

        return response.message;
    }
}
