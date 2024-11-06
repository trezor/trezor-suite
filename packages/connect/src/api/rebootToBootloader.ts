// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RebootToBootloader.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { UI } from '../events';
import { PROTO } from '../constants';

export default class RebootToBootloader extends AbstractMethod<
    'rebootToBootloader',
    PROTO.RebootToBootloader
> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.skipFinalReload = true;
        this.keepSession = false;
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;
        Assert(PROTO.RebootToBootloader, payload);

        this.params = {
            boot_command: payload.boot_command,
            firmware_header: payload.firmware_header,
            language_data_length: payload.language_data_length,
        };
    }

    get info() {
        return 'Reboot to bootloader';
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: `Reboot`,
            },
            label: 'Are you sure you want to reboot to bootloader?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('RebootToBootloader', 'Success', this.params);

        return response.message;
    }
}
