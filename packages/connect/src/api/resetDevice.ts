// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ResetDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';

export default class ResetDevice extends AbstractMethod<'resetDevice', PROTO.ResetDevice> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;
        // validate bundle type
        Assert(PROTO.ResetDevice, payload);

        this.params = {
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

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Do you really you want to create a new wallet?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ResetDevice', 'Success', this.params);

        return response.message;
    }
}
