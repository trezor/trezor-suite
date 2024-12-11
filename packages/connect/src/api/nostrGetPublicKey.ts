import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { validatePath } from '../utils/pathUtils';
import { NostrGetPublicKey as NostrGetPubkeySchema } from '../types/api/nostrGetPublicKey';

export default class NostrGetPublicKey extends AbstractMethod<'nostrGetPublicKey', Params> {
    init() {
        this.requiredPermissions = ['read'];

        // create a bundle with only one batch if bundle doesn't exists

        // validate bundle type
        Assert(NostrGetPubkeySchema, this.payload);

        const address_n = validatePath(this.payload.path);

        this.params = {
            address_n,
        };
    }

    get info() {
        return 'Export nostr public key';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label: 'hello',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('NostrGetPubkey', 'NostrPubkey', this.params);
        return response.message;
    }
}
