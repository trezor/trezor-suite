// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/WipeDevice.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI, DEVICE } from '../events';
import { getDeviceLabelOrName } from '../utils/deviceFeaturesUtils';
import { getFirmwareRange } from './common/paramsValidator';

export default class WipeDevice extends AbstractMethod<'wipeDevice'> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS, UI.BOOTLOADER];
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }

    get confirmation() {
        const messageObjectDevice = this.device.toMessageObject();

        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'wipe',
                label: `Wipe ${getDeviceLabelOrName(messageObjectDevice)}`,
            },
            label: 'Are you sure you want to wipe your device?',
        };
    }

    get info() {
        return 'Wipe device';
    }

    async run() {
        const cmd = this.device.getCommands();

        if (this.device.isBootloader()) {
            // firmware doesn't send this button request in bootloader mode
            this.device.emit(DEVICE.BUTTON, this.device, { code: 'ButtonRequest_WipeDevice' });
        }

        const response = await cmd.typedCall('WipeDevice', 'Success');

        return response.message;
    }
}
