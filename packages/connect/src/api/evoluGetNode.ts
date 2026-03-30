import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetNode extends AbstractMethod<'evoluGetNode', PROTO.EvoluGetNode> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'evoluGetNode'>) {
        const { payload } = message;

        Assert(PROTO.EvoluGetNode, payload);

        const params = {
            proof_of_delegated_identity: payload.proof_of_delegated_identity,
        };

        super(message, params);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Evolu get node';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('EvoluGetNode', 'EvoluNode', this.params);

        return response.message;
    }
}
