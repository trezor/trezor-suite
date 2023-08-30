// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplyFlags.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { UI, createUiMessage } from '../events';
import type { PROTO } from '../constants';

export default class ApplyFlags extends AbstractMethod<'applyFlags', PROTO.ApplyFlags> {
    async init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        validateParams(payload, [{ name: 'flags', type: 'number', required: true }]);

        this.params = {
            flags: payload.flags,
        };
    }

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                customConfirmButton: {
                    className: 'confirm',
                    label: 'Proceed',
                },
                label: 'Do you really want to apply flags?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ApplyFlags', 'Success', this.params);
        return response.message;
    }
}
