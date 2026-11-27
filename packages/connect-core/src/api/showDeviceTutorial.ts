import { UI_EVENTS } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class ShowDeviceTutorial extends AbstractMethod<'showDeviceTutorial'> {
    constructor(message: MethodMessage<'showDeviceTutorial'>) {
        super(message, undefined);
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI_EVENTS.DEVICE_NOT_INITIALIZED];
    }
    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');

        return response.message;
    }
}
