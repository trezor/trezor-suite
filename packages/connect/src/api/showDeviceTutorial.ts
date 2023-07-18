import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO } from '../constants';
import { UI } from '../events';

export default class ShowDeviceTutorial extends AbstractMethod<
    'showDeviceTutorial',
    PROTO.ShowDeviceTutorial
> {
    init() {
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
        this.info = 'Show device tutorial';
        this.useEmptyPassphrase = true;
        this.useDeviceState = false;
        this.allowDeviceMode = [UI.INITIALIZE];
    }

    async run() {
        const cmd = this.device.getCommands();

        const response = await cmd.typedCall('ShowDeviceTutorial', 'Success');
        return response.message;
    }
}
