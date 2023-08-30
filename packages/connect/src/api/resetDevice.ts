// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ResetDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI, createUiMessage } from '../events';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import type { PROTO } from '../constants';

export default class ResetDevice extends AbstractMethod<'resetDevice', PROTO.ResetDevice> {
    confirmed?: boolean;

    async init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;
        // validate bundle type
        validateParams(payload, [
            { name: 'display_random', type: 'boolean' },
            { name: 'strength', type: 'number' },
            { name: 'passphrase_protection', type: 'boolean' },
            { name: 'pin_protection', type: 'boolean' },
            { name: 'language', type: 'string' },
            { name: 'label', type: 'string' },
            { name: 'u2f_counter', type: 'number' },
            { name: 'skip_backup', type: 'boolean' },
            { name: 'no_backup', type: 'boolean' },
            { name: 'backup_type', type: 'number' },
        ]);

        this.params = {
            display_random: payload.display_random,
            strength: payload.strength || 256,
            passphrase_protection: payload.passphrase_protection,
            pin_protection: payload.pin_protection,
            language: payload.language,
            label: payload.label,
            u2f_counter: payload.u2f_counter || Math.floor(Date.now() / 1000),
            skip_backup: payload.skip_backup,
            no_backup: payload.no_backup,
            backup_type: payload.backup_type,
        };
    }

    get info() {
        return 'Setup device';
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                label: 'Do you really you want to create a new wallet?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ResetDevice', 'Success', this.params);
        return response.message;
    }
}
