import type { PermissionRequest, WardUpdateResult } from '@trezor/connect-common';
import { WardUpdateSchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { callWard } from '../wardAdapter';

/** `wardUpdate`: wardd's write flow (insert, update or delete), relayed on this device session. */
export default class WardUpdate extends AbstractMethod<'wardUpdate', WardUpdateSchema> {
    constructor(message: MethodMessage<'wardUpdate'>) {
        const { payload } = message;
        Assert(WardUpdateSchema, payload);

        super(message, {
            appId: payload.appId,
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            metadata: payload.metadata,
            wardId: payload.wardId,
            // explicit: `metadata: {}` is an update to "<networkSymbol>:{}", never a delete
            delete: payload.delete === true,
        });
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Update WARD address entry';
    }

    run() {
        return callWard<WardUpdateResult>(
            this.getDevice().getCommands(),
            'wardUpdate',
            'update',
            this.params,
        );
    }
}
