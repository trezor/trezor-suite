// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RecoveryDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI, createUiMessage } from '../events';
import { Assert } from '@trezor/schema-utils';
import type { PROTO } from '../constants';
import { RecoveryDevice as RecoveryDeviceSchema } from '../types/api/recoveryDevice';

export default class RecoveryDevice extends AbstractMethod<'recoveryDevice', PROTO.RecoveryDevice> {
    init() {
        this.requiredPermissions = ['management'];
        this.useEmptyPassphrase = true;

        const { payload } = this;

        Assert(RecoveryDeviceSchema, payload);
        this.params = {
            word_count: payload.word_count,
            passphrase_protection: payload.passphrase_protection,
            pin_protection: payload.pin_protection,
            language: payload.language,
            label: payload.label,
            enforce_wordlist: payload.enforce_wordlist,
            type: payload.type,
            u2f_counter: payload.u2f_counter,
            dry_run: payload.dry_run,
        };
        this.allowDeviceMode = [...this.allowDeviceMode, UI.INITIALIZE];
        this.useDeviceState = false;
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
                label: 'Do you want to recover device from seed?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('RecoveryDevice', 'Success', this.params);
        return response.message;
    }
}
