import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { TRANSPORT_ERROR } from '@trezor/transport';

import { PROTO } from '../constants';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { UI_REQUEST } from '../events';

export default class BleUnpair extends AbstractMethod<'bleUnpair', PROTO.BleUnpair> {
    constructor(message: MethodMessage<'bleUnpair'>, context: MethodContext) {
        super(message, context);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;
        this.params = {
            all: payload.all,
        };

        Assert(PROTO.BleUnpair, payload);
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        // unpair current bluetooth connection session or all known sessions
        try {
            const response = await cmd.typedCall('BleUnpair', 'Success', this.params);

            return response.message;
        } catch (error) {
            // bluetooth race condition between DeviceList disconnect event and transport read error
            // this method is either interrupted from the core as result of disconnect event, TrezorConnect call respond before we gets here
            // or fails here with transport read/write error
            // in both cases Device_Disconnected error should be handled as "expected success"
            if (
                this.getDevice().descriptor.apiType === 'bluetooth' &&
                error.message === TRANSPORT_ERROR.INTERFACE_DATA_TRANSFER
            ) {
                // typed error is considered as "method failed successfully"
                throw ERRORS.TypedError('Device_Disconnected');
            }

            throw error;
        }
    }
}
