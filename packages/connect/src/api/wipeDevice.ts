// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/WipeDevice.js

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import { Device } from '../device/Device';
import { DEVICE, UI_REQUEST } from '../events';
import { getFirmwareRange } from './common/paramsValidator';

export default class WipeDevice extends AbstractMethod<'wipeDevice'> {
    constructor(message: { id?: number; payload: Payload<'wipeDevice'> }) {
        super(message);

        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS, UI_REQUEST.BOOTLOADER];
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        // Configuration already set in constructor
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'wipe',
                label: `Wipe`,
            },
            label: 'Are you sure you want to wipe your device?',
        };
    }

    get info() {
        return 'Wipe device';
    }

    setDevice(device: Device) {
        super.setDevice(device);

        // In bootloader mode we need to skip the final reload, otherwise we never get the resolution
        // THP device will require pairing. THP state is cleared, credentials are invalid
        this.skipFinalReload = device.features?.bootloader_mode || !!device.getThpState();
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        if (this.getDevice().isBootloader()) {
            // firmware doesn't send this button request in bootloader mode
            this.getDevice().emit(DEVICE.BUTTON, {
                device: this.getDevice(),
                payload: { code: 'ButtonRequest_WipeDevice' },
            });
        }

        const response = await cmd.typedCall('WipeDevice', 'Success');
        const thpState = this.getDevice().getThpState();
        if (thpState) {
            // device will require THP pairing in the next call
            // reset state and do not call GetFeatures (finalReload)
            thpState.resetState();
        }

        return response.message;
    }
}
