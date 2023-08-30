// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetSettings.js

import { AbstractMethod } from '../core/AbstractMethod';
import { DataManager } from '../data/DataManager';

export default class GetSettings extends AbstractMethod<'getSettings'> {
    async init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;
    }

    run() {
        return Promise.resolve(DataManager.getSettings());
    }
}
