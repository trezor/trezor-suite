// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetSettings.js

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';

export default class GetSettings extends AbstractMethod<'getSettings'> {
    constructor(message: MethodMessage<'getSettings'>) {
        super(message);
        this.useDevice = false;
        this.useUi = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        // Configuration already set in constructor
    }

    run() {
        return Promise.resolve(DataManager.getSettings());
    }
}
