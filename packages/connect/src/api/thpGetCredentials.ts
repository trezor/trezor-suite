import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';
import { getThpCredentials } from '../device/thp';
import { DEVICE, UI_REQUEST } from '../events';

export default class ThpGetCredentials extends AbstractMethod<'thpGetCredentials'> {
    constructor(message: MethodMessage<'thpGetCredentials'>) {
        super(message);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {}

    async run() {
        const thpState = this.getDevice().getThpState();
        if (!thpState?.handshakeCredentials) {
            throw ERRORS.TypedError('Device_ThpStateMissing');
        }

        const credentials = await getThpCredentials(this.getDevice(), true);
        thpState.setPairingCredentials([credentials]);

        // update values in DataManager
        DataManager.getSettings('thp')?.knownCredentials?.push(credentials);

        // emit change event to host, store new credentials in DataManager
        this.getDevice().emit(DEVICE.THP_CREDENTIALS_CHANGED, {
            credentials,
        });

        return credentials;
    }
}
