import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { AbstractMethod, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { UI_REQUEST } from '../events';
import { getFirmwareRange } from './common/paramsValidator';

export default class ShowDeviceTutorial extends AbstractMethod<
    'showDeviceTutorial',
    PROTO.ShowDeviceTutorial
> {
    constructor(message: MethodMessage<'showDeviceTutorial'>) {
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
