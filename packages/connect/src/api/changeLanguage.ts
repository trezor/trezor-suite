// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangeLanguage.js

import {
    ChangeLanguage as ChangeLanguageSchema,
    type MethodPermission,
    UI_REQUEST,
} from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { changeLanguage } from '../device/workflow/changeLanguage';

export default class ChangeLanguage extends AbstractMethod<'changeLanguage', ChangeLanguageSchema> {
    constructor(message: MethodMessage<'changeLanguage'>) {
        const { payload } = message;

        Assert(ChangeLanguageSchema, payload);

        super(message, payload);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useEmptyPassphrase = true;
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
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
