// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangeLanguage.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { ChangeLanguage as ChangeLanguageSchema } from '../types/api/changeLanguage';

export default class ChangeLanguage extends AbstractMethod<'changeLanguage', ChangeLanguageSchema> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        Assert(ChangeLanguageSchema, payload);

        this.params = payload;
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you want to change language?',
        };
    }

    run() {
        const { language, binary } = this.params;

        if (binary) {
            return this.device.changeLanguage({ binary });
        } else {
            return this.device.changeLanguage({ language });
        }
    }
}
