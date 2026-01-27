import { ERRORS } from '@trezor/connect-common/src/constants';

import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';
import { getThpCredentials } from '../device/thp';
import { DEVICE, UI } from '../events';

export default class ThpGetCredentials extends AbstractMethod<'thpGetCredentials'> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
    }

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
