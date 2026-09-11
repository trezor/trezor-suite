import { DEVICE, type PermissionRequest, UI_EVENTS } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import * as settingsStore from '../data/settingsStore';
import { getThpCredentials } from '../device/thp';

export default class ThpGetCredentials extends AbstractMethod<'thpGetCredentials'> {
    constructor(message: MethodMessage<'thpGetCredentials'>) {
        super(message, undefined);
        this.allowDeviceMode = [UI_EVENTS.DEVICE_NOT_INITIALIZED, UI_EVENTS.DEVICE_SEEDLESS];
        this.useDeviceState = false;
    }
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    async run() {
        const thpState = this.getDevice().getThpState();
        if (!thpState?.handshakeCredentials) {
            throw ERRORS.TypedError('Device_ThpStateMissing');
        }

        const credentials = await getThpCredentials(this.getDevice(), true);
        thpState.setPairingCredentials([credentials]);

        // update cached settings
        settingsStore.get('thp')?.knownCredentials?.push(credentials);

        // emit change event to host, store new credentials
        this.getDevice().emit(DEVICE.THP_CREDENTIALS_CHANGED, {
            credentials,
        });

        return credentials;
    }
}
