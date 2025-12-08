import { ERRORS } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';
import { UI } from '../events';

export default class ThpRemoveCredentials extends AbstractMethod<'thpRemoveCredentials'> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
    }

    run() {
        const thpState = this.device.getThpState();
        if (!thpState) {
            throw ERRORS.TypedError('Device_ThpStateMissing');
        }

        const knownCredentials = DataManager.getSettings('thp')?.knownCredentials;
        if (knownCredentials) {
            const toRemoveCredentials = (
                this.payload.credentials || thpState.pairingCredentials
            ).map(c => c.credential);

            const index = knownCredentials.findIndex(({ credential }) =>
                toRemoveCredentials.includes(credential),
            );

            if (index >= 0) {
                knownCredentials.splice(index, 1); // remove credential from DataManager
            }
        }

        // should we change Device to unacquired?
        // should @trezor/connect remember that this device is requested not to be remembered?
        // this will work after device disconnection

        thpState.resetState(); // reset device state

        // followup: increase credentials counter on Trezor (not implemented in firmware yet)
        return Promise.resolve({ message: 'Success' });
    }
}
