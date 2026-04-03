import { UI_REQUEST } from '@trezor/connect-common';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class ShowDeviceTutorial extends AbstractMethod<'showDeviceTutorial'> {
    constructor(message: MethodMessage<'showDeviceTutorial'>) {
        super(message, undefined);
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE];
    }
    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    get info() {
        return 'Show device tutorial';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');

        return response.message;
    }
}
