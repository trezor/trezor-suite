// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetSettings.js

import { type PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import * as enabledNetworksStore from '../data/enabledNetworksStore';
import * as settingsStore from '../data/settingsStore';

export default class GetSettings extends AbstractMethod<'getSettings'> {
    constructor(message: MethodMessage<'getSettings'>) {
        super(message, undefined);
        this.useDevice = false;
        this.useUi = false;
    }
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    run() {
        return Promise.resolve({
            ...settingsStore.get(),
            enabledNetworks: enabledNetworksStore.get(),
        });
    }
}
