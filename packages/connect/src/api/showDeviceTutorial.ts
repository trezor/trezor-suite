import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import { UI } from '../events';
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
        this.allowDeviceMode = [UI.INITIALIZE];
    }
    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {}

    get info() {
        return 'Show device tutorial';
    }

    async run() {
        const cmd = this.device.getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');

        return response.message;
    }
}
