import { ERRORS } from '@trezor/connect-common/src/constants';

import { AbstractMethod, MethodPermission, Payload } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';
import { getThpCredentials } from '../device/thp';
import { DEVICE, UI } from '../events';

export default class ThpGetCredentials extends AbstractMethod<'thpGetCredentials'> {
    constructor(message: { id?: number; payload: Payload<'thpGetCredentials'> }) {
        super(message);
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {}

    async run() {
        const thpState = this.device.getThpState();
        if (!thpState?.handshakeCredentials) {
            throw ERRORS.TypedError('Device_ThpStateMissing');
        }

        const credentials = await getThpCredentials(this.device, true);
        thpState.setPairingCredentials([credentials]);

        // update values in DataManager
        DataManager.getSettings('thp')?.knownCredentials?.push(credentials);

        // emit change event to host, store new credentials in DataManager
        this.device.emit(DEVICE.THP_CREDENTIALS_CHANGED, {
            credentials,
        });

        return credentials;
    }
}
