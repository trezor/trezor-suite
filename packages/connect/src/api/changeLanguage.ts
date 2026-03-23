// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangeLanguage.js

import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { changeLanguage } from '../device/workflow/changeLanguage';
import { UI_REQUEST } from '../events';
import { ChangeLanguage as ChangeLanguageSchema } from '../types/api/changeLanguage';

export default class ChangeLanguage extends AbstractMethod<'changeLanguage', ChangeLanguageSchema> {
    constructor(message: MethodMessage<'changeLanguage'>) {
        super(message);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useEmptyPassphrase = true;
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
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
            return changeLanguage({ device: this.getDevice(), binary });
        } else {
            return changeLanguage({ device: this.getDevice(), language });
        }
    }
}
