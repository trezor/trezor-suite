import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';

export default class NostrSignEvent extends AbstractMethod<'nostrSignEvent', PROTO.NostrSignEvent> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        Assert(PROTO.NostrSignEvent, this.payload);

        this.params = this.payload;
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
