import type { PermissionRequest, WardInitResult } from '@trezor/connect-common';
import { WardInitSchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { callWard } from '../wardAdapter';

/** `wardInit`: wardd's sync flow, relayed on this device session. */
export default class WardInit extends AbstractMethod<'wardInit', WardInitSchema> {
    constructor(message: MethodMessage<'wardInit'>) {
        const { payload } = message;
        Assert(WardInitSchema, payload);

        super(message, { wardId: payload.wardId });
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Initialize WARD state (sync round)';
    }

    run() {
        return callWard<WardInitResult>(
            this.getDevice().getCommands(),
            'wardInit',
            'sync',
            this.params,
        );
    }
}
