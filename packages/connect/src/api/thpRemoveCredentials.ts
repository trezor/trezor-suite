import { UI_REQUEST } from '@trezor/connect-common';
import type { ThpCredentials } from '@trezor/protocol';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';

type Params = { credentials: ThpCredentials[] };

export default class ThpRemoveCredentials extends AbstractMethod<'thpRemoveCredentials', Params> {
    constructor(message: MethodMessage<'thpRemoveCredentials'>) {
        super(message);
        this.useDevice = this.payload.device !== undefined;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        this.params = { credentials: this.payload.credentials || [] };
    }

    run() {
        const requestedCredentials = this.params.credentials;
        if (this.useDevice) {
            const thpState = this.getDevice().getThpState();
            if (thpState) {
                requestedCredentials.push(...thpState.pairingCredentials);

                // should we change Device to unacquired?
                // should @trezor/connect remember that this device is requested not to be remembered?
                // this will work after device disconnection

                thpState.resetState(); // reset device state

                // followup: increase credentials counter on Trezor (not implemented in firmware yet)
            }
        }

        const credentialsMap = new Map(requestedCredentials.map(c => [c.credential, c]));
        const knownCredentials = DataManager.getSettings('thp')?.knownCredentials;
        if (knownCredentials && knownCredentials.length > 0) {
            credentialsMap.forEach(c => {
                let index;
                while (
                    (index = knownCredentials.findIndex(
                        ({ credential }) => c.credential === credential,
                    )) >= 0
                ) {
                    knownCredentials.splice(index, 1);
                }
            });
        }

        return Promise.resolve({ message: 'Success' });
    }
}
