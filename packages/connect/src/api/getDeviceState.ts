// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetDeviceState.js

import { type MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { AbstractMethod } from '../core/AbstractMethod';

export default class GetDeviceState extends AbstractMethod<'getDeviceState'> {
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    run() {
        const state = this.getDevice().getState();
        if (!state?.staticSessionId) {
            throw ERRORS.TypedError('Runtime', 'Device state not set');
        }

        return Promise.resolve({ state });
    }
}
