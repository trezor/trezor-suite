import type { PermissionRequest, WardDisplayAddressResult } from '@trezor/connect-common';
import { WardDisplayAddressSchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { withWard } from '../wardAdapter';

/**
 * `wardDisplayAddress`: wardd syncs the session, then Connect's own DisplayAddress runs with the
 * device's label pull answered by wardd -- the same pattern a native call (getAddress, signing)
 * uses when the device pulls a WARD proof mid-flow.
 */
export default class WardDisplayAddress extends AbstractMethod<
    'wardDisplayAddress',
    WardDisplayAddressSchema
> {
    constructor(message: MethodMessage<'wardDisplayAddress'>) {
        const { payload } = message;
        Assert(WardDisplayAddressSchema, payload);

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
        return 'Show WARD address with label';
    }

    run(): Promise<WardDisplayAddressResult> {
        const cmd = this.getDevice().getCommands();
        const { appId, address, wardId } = this.params;

        return withWard(cmd, 'wardDisplayAddress', async (endpoint, relay) => {
            const synced = await endpoint.call('sync', { wardId }, relay);
            await cmd.typedCall('DisplayAddress', 'Success', { address, app_id: appId });

            return { shown: true, wardId: synced.wardId as string };
        });
    }
}
