import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class EvoluSignRegistrationRequest extends AbstractMethod<
    'evoluSignRegistrationRequest',
    PROTO.EvoluSignRegistrationRequest
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'evoluSignRegistrationRequest'>) {
        const { payload } = message;

        Assert(PROTO.EvoluSignRegistrationRequest, payload);

        const params = {
            challenge_from_server: payload.challenge_from_server,
            size_to_acquire: payload.size_to_acquire,
            proof_of_delegated_identity: payload.proof_of_delegated_identity,
        };

        super(message, params);
        this.useEmptyPassphrase = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {}

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
