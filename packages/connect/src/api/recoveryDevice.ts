// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RecoveryDevice.js

import { UI_REQUEST } from '@trezor/connect-common';
import { RecoveryDevice as RecoveryDeviceSchema } from '@trezor/connect-common/src/types/api/recoveryDevice';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class RecoveryDevice extends AbstractMethod<'recoveryDevice', PROTO.RecoveryDevice> {
    constructor(message: MethodMessage<'recoveryDevice'>) {
        const { payload } = message;

        Assert(RecoveryDeviceSchema, payload);
        const params = {
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

        super(message, params);
        this.allowDeviceMode = [...this.allowDeviceMode, UI_REQUEST.INITIALIZE];
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.useEmptyPassphrase = true;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
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
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('RecoveryDevice', 'Success', this.params);

        return response.message;
    }

    get info() {
        return 'Recover device';
    }
}
