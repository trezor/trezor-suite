import type { PermissionRequest, WardCacheEntryResult } from '@trezor/connect-common';
import { WardCacheEntrySchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { callWard } from '../wardAdapter';

/**
 * `wardCacheEntry`: wardd's offline-cache flow, relayed on this device session. The device pulls
 * the entry's proof, verifies it and stores the entry in its offline cache.
 */
export default class WardCacheEntry extends AbstractMethod<'wardCacheEntry', WardCacheEntrySchema> {
    constructor(message: MethodMessage<'wardCacheEntry'>) {
        const { payload } = message;
        Assert(WardCacheEntrySchema, payload);

        super(message, {
            entryKey: payload.entryKey.toLowerCase(),
            sticky: payload.sticky === true,
            wardId: payload.wardId,
        });
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Cache WARD entry';
    }

    run() {
        return callWard<WardCacheEntryResult>(
            this.getDevice().getCommands(),
            'wardCacheEntry',
            'cacheEntry',
            this.params,
        );
    }
}
