import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';

export default class LoadDevice extends AbstractMethod<'loadDevice', PROTO.LoadDevice> {
    init() {
        this.allowDeviceMode = [UI.SEEDLESS];
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;
        // validate bundle type
        Assert(PROTO.LoadDevice, payload);

        this.params = {
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
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('LoadDevice', 'Success', this.params);

        return response.message;
    }
}
