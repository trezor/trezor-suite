import type { PermissionRequest, WardLookupResult } from '@trezor/connect-common';
import { WardVerifySchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { callWard } from '../wardAdapter';

/** `wardLookup`: wardd's lookup flow, relayed on this device session: the device's verdict and the stored label. */
export default class WardLookup extends AbstractMethod<'wardLookup', WardVerifySchema> {
    constructor(message: MethodMessage<'wardLookup'>) {
        const { payload } = message;
        Assert(WardVerifySchema, payload);

        super(message, {
            appId: payload.appId,
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            wardId: payload.wardId,
        });
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    get info() {
        return 'Look up WARD address entry';
    }

    run() {
        return callWard<WardLookupResult>(
            this.getDevice().getCommands(),
            'wardLookup',
            'lookup',
            this.params,
        );
    }
}
