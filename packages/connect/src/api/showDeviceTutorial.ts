import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import type { Device } from '../device/Device';
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

    async run(device: Device) {
        const cmd = device.getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');

        return response.message;
    }
}
