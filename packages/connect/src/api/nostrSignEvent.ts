import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { NostrSignEvent as NostrSignEventSchema } from '../types/api/nostrSignEvent';
import { validatePath } from '../utils/pathUtils';

export default class NostrSignEvent extends AbstractMethod<'nostrSignEvent', PROTO.NostrSignEvent> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        Assert(NostrSignEventSchema, this.payload);

        const path = validatePath(this.payload.path, 3);
        console.log('path', path);

        this.params = {
            ...this.payload,
            address_n: path,
        };
    }

    get info() {
        return 'sign nostr event? ';
    }

    get confirmation() {
        return {
            // todo:
            view: 'export-xpub' as const,
            label: 'sign?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('NostrSignEvent', 'NostrEventSignature', this.params);

        return response.message;
    }
}
