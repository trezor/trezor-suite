// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplySettings.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { PROTO } from '../constants';
import { ApplySettings as ApplySettingsSchema } from '../types/api/applySettings';

export default class ApplySettings extends AbstractMethod<'applySettings', PROTO.ApplySettings> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        const { payload } = this;

        Assert(ApplySettingsSchema, payload);

        this.params = {
            ...payload,
            _passphrase_source: payload.passphrase_source,
        };
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you really want to change device settings?',
        };
    }

    async run() {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('ApplySettings', 'Success', this.params);

        return response.message;
    }
}
