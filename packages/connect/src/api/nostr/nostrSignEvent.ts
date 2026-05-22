import {
    ExperimentalMethod,
    type MethodPermission,
    NostrSignEvent as NostrSignEventSchema,
    type PROTO,
} from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';
import { validatePath } from '../../utils/pathUtils';

export default class NostrSignEvent extends AbstractMethod<'nostrSignEvent', PROTO.NostrSignEvent> {
    constructor(message: MethodMessage<'nostrSignEvent'>) {
        const { payload } = message;

        Assert(NostrSignEventSchema, payload);
        Assert(ExperimentalMethod, payload);

        const params = {
            address_n: validatePath(payload.path),
            created_at: payload.created_at,
            kind: payload.kind,
            tags: payload.tags,
            content: payload.content,
        };

        super(message, params);
    }

    get requiredPermissions(): MethodPermission[] {
        return ['write'];
    }

    get info() {
        return 'Sign Nostr event';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { message } = await cmd.typedCall(
            'NostrSignEvent',
            'NostrEventSignature',
            this.params,
        );

        return message;
    }
}
