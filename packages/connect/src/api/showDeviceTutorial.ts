import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { UI_REQUEST } from '../events';
import { getFirmwareRange } from './common/paramsValidator';

export default class ShowDeviceTutorial extends AbstractMethod<
    'showDeviceTutorial',
    PROTO.ShowDeviceTutorial
> {
    constructor(message: { id?: number; payload: Payload<'showDeviceTutorial'> }) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE];
    }
    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {}

    get info() {
        return 'Show device tutorial';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');

        return response.message;
    }
}
