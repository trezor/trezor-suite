import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class EvoluGetDelegatedIdentityKey extends AbstractMethod<
    'evoluGetDelegatedIdentityKey',
    PROTO.EvoluGetDelegatedIdentityKey
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'evoluGetDelegatedIdentityKey'>) {
        super(message, {});
        this.useDevice = true;
        this.useUi = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Evolu get delegated identity key';
    }

    async run() {
        const thpState = this.getDevice().getThpState();
        if (thpState) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCredential: (typeof thpState.pairingCredentials)[number] =
                thpState.pairingCredentials[0];
            this.params = {
                thp_credential: firstCredential.credential,
            };
        }

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'EvoluGetDelegatedIdentityKey',
            'EvoluDelegatedIdentityKey',
            this.params,
        );

        return response.message;
    }
}
