import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { validatePath } from '../utils/pathUtils';
import { NostrGetPublicKey as NostrGetPubkeySchema } from '../types/api/nostrGetPublicKey';
import { PROTO } from '../constants';

export default class NostrGetPublicKey extends AbstractMethod<
    'nostrGetPublicKey',
    PROTO.NostrGetPubkey
> {
    init() {
        this.requiredPermissions = ['read'];

        // create a bundle with only one batch if bundle doesn't exists

        // validate bundle type
        Assert(NostrGetPubkeySchema, this.payload);

        const address_n = validatePath(this.payload.path);

        this.params = {
            address_n,
            show_display: this.payload.showOnTrezor,
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
