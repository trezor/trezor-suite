import type { PermissionRequest, WardVerifyResult } from '@trezor/connect-common';
import { WardVerifySchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { callWard } from '../wardAdapter';

/** `wardVerify`: wardd's lookup flow, relayed on this device session: the device's verdict only. */
export default class WardVerify extends AbstractMethod<'wardVerify', WardVerifySchema> {
    constructor(message: MethodMessage<'wardVerify'>) {
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
        return 'Verify WARD address entry';
    }

    async run() {
        const result = await callWard<WardVerifyResult>(
            this.getDevice().getCommands(),
            'wardVerify',
            'lookup',
            this.params,
        );

        return {
            isMember: result.isMember,
            valid: result.valid,
            counter: result.counter,
            wardId: result.wardId,
        } satisfies WardVerifyResult;
    }
}
