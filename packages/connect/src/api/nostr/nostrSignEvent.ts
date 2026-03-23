import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission } from '../../core/AbstractMethod';
import { validatePath } from '../../utils/pathUtils';
import { NostrSignEvent as NostrSignEventSchema } from '../../types/api/nostr/nostrSignEvent';
import { PROTO } from '../../constants';

export default class NostrSignEvent extends AbstractMethod<'nostrSignEvent', PROTO.NostrSignEvent> {
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        Assert(NostrSignEventSchema, this.payload);

        const address_n = validatePath(this.payload.path);

        this.params = {
            address_n,
            created_at: this.payload.created_at,
            kind: this.payload.kind,
            tags: this.payload.tags,
            content:  this.payload.content,
        };
    }

    get info() {
        return 'Sign Nostr event';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('NostrSignEvent', 'NostrEventSignature', this.params);

        return response.message;
    }
}
