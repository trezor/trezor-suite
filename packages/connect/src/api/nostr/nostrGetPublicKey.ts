import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission } from '../../core/AbstractMethod';
import { validatePath } from '../../utils/pathUtils';
import { NostrGetPublicKey as NostrGetPubkeySchema } from '../../types/api/nostr/nostrGetPublicKey';
import { PROTO } from '../../constants';

export default class NostrGetPublicKey extends AbstractMethod<
    'nostrGetPublicKey',
    PROTO.NostrGetPubkey
> {
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        // create a bundle with only one batch if bundle doesn't exists

        // validate bundle type
        Assert(NostrGetPubkeySchema, this.payload);

        const address_n = validatePath(this.payload.path);

        this.params = {
            address_n,
        };
    }

    get info() {
        return 'Export nostr public key (npub)';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label: 'hello',
        };
    }

    async run() {
        const device = this.getDevice();
        const cmd = device.getCommands();
        const response = await cmd.typedCall('NostrGetPubkey', 'NostrPubkey', this.params);
        return response.message;
    }
}
