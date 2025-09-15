import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetNode extends AbstractMethod<'evoluGetNode', PROTO.EvoluGetNode> {
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;

        Assert(PROTO.EvoluGetNode, payload);

        this.params = {};
    }

    get info() {
        return 'Evolu get node';
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('EvoluGetNode', 'EvoluNode', this.params);

        return response.message;
    }
}
