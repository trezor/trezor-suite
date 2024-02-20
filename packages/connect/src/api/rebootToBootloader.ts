// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RebootToBootloader.js

import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { UI, createUiMessage } from '../events';
import { Assert } from '@trezor/schema-utils';
import { PROTO } from '../constants';

export default class RebootToBootloader extends AbstractMethod<
    'rebootToBootloader',
    PROTO.RebootToBootloader
> {
    confirmed?: boolean;

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
                customConfirmButton: {
                    className: 'confirm',
                    label: `Reboot`,
                },
                label: 'Are you sure you want to reboot to bootloader?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;

        return this.confirmed;
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('RebootToBootloader', 'Success', this.params);

        return response.message;
    }
}
