import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class EvoluSignRegistrationRequest extends AbstractMethod<
    'evoluSignRegistrationRequest',
    PROTO.EvoluSignRegistrationRequest
> {
    hasBundle?: boolean;

    constructor(message: { id?: number; payload: Payload<'evoluSignRegistrationRequest'> }) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.useEmptyPassphrase = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.EvoluSignRegistrationRequest, payload);

        this.params = {
            challenge_from_server: payload.challenge_from_server,
            size_to_acquire: payload.size_to_acquire,
            proof_of_delegated_identity: payload.proof_of_delegated_identity,
        };
    }

    get info() {
        return 'Evolu sign registration request';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'EvoluSignRegistrationRequest',
            'EvoluRegistrationRequest',
            this.params,
        );

        return response.message;
    }
}
