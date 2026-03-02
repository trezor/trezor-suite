// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetDeviceState.js

import { ERRORS } from '@trezor/connect-common/src/constants';

import { AbstractMethod, MethodPermission } from '../core/AbstractMethod';
import type { Device } from '../device/Device';

export default class GetDeviceState extends AbstractMethod<'getDeviceState'> {
    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {}

    run(device: Device) {
        const state = device.getState();
        if (!state?.staticSessionId) {
            throw ERRORS.TypedError('Runtime', 'Device state not set');
        }

        return Promise.resolve({ state });
    }
}
