import { UI_REQUEST } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';

export default class LoadDevice extends AbstractMethod<'loadDevice', PROTO.LoadDevice> {
    constructor(message: MethodMessage<'loadDevice'>) {
        const { payload } = message;
        // validate bundle type
        Assert(PROTO.LoadDevice, payload);

        const params = {
            mnemonics: payload.mnemonics,
            pin: payload.pin,
            passphrase_protection: payload.passphrase_protection,
            language: payload.language,
            label: payload.label,
            skip_checksum: payload.skip_checksum,
            u2f_counter: payload.u2f_counter,
            needs_backup: payload.needs_backup,
            no_backup: payload.no_backup,
        };

        super(message, params);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE];
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get info() {
        return 'Load seed and related internal settings.';
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Do you really you want to load device?',
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('LoadDevice', 'Success', this.params);

        return response.message;
    }
}
