import { type PermissionRequest } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

/**
 * Pre-flight for a transaction to a contact: the device verifies that `address` was
 * attested by the contact, and that the contact carries a user-confirmed label in
 * the labeling trie. It then pins address -> label for the session, so the SignTx
 * that follows can render the contact name on the output confirmation screen.
 *
 * Must be called with `keepSession: true` so no Initialize (which clears the pins)
 * fires between this call and signTransaction.
 */
export default class AuthLabelBindAddress extends AbstractMethod<
    'authLabelBindAddress',
    PROTO.AuthLabelBindAddress
> {
    constructor(message: MethodMessage<'authLabelBindAddress'>) {
        const { payload } = message;

        Assert(PROTO.AuthLabelBindAddress, payload);

        super(message, {
            key_type: payload.key_type,
            key_bytes: payload.key_bytes,
            proof: payload.proof,
            mac: payload.mac,
            address: payload.address,
            slip44: payload.slip44,
            created_at: payload.created_at,
            kind: payload.kind,
            signature: payload.signature,
        });
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'read_xpub' }];
    }

    get info() {
        return 'Authenticated labeling: bind a verified contact address';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'AuthLabelBindAddress',
            'AuthLabelBindAddressAck',
            this.params,
        );

        return response.message;
    }
}
