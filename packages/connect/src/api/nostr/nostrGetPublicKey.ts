import {
    ExperimentalMethod,
    GetPublicKey as GetPublicKeySchema,
    type MethodPermission,
    type PROTO,
} from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';
import { validatePath } from '../../utils/pathUtils';

export default class NostrGetPublicKey extends AbstractMethod<
    'nostrGetPublicKey',
    PROTO.NostrGetPubkey
> {
    constructor(message: MethodMessage<'nostrGetPublicKey'>) {
        const { payload } = message;

        Assert(GetPublicKeySchema, payload);
        Assert(ExperimentalMethod, payload);

        const params = {
            address_n: validatePath(payload.path),
        };

        super(message, params);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export nostr public key';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label: 'Export Nostr public key',
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall('NostrGetPubkey', 'NostrPubkey', this.params);

        return message;
    }
}
