// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RecoveryDevice.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
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
            input_method: payload.input_method,
            type: payload.type,
            u2f_counter: payload.u2f_counter,
        };

        this.allowDeviceMode = [...this.allowDeviceMode, UI.INITIALIZE];
        this.useDeviceState = false;
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you want to recover device from seed?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('RecoveryDevice', 'Success', this.params);

        return response.message;
    }

    get info() {
        return 'Recover device';
    }
}
