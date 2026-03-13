import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluGetNode extends AbstractMethod<'evoluGetNode', PROTO.EvoluGetNode> {
    hasBundle?: boolean;

    constructor(message: { id?: number; payload: Payload<'evoluGetNode'> }) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.EvoluGetNode, payload);

        this.params = {
            proof_of_delegated_identity: payload.proof_of_delegated_identity,
        };
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
