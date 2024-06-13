// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetDeviceState.js

import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';

export default class GetDeviceState extends AbstractMethod<'getDeviceState'> {
    init() {
        this.requiredPermissions = [];
    }

    run() {
        const state = this.device.getState();
        if (!state?.staticSessionId) {
            throw ERRORS.TypedError('Runtime', 'Device state not set');
        }

        return Promise.resolve({ state: state.staticSessionId, _state: state });
    }
}
