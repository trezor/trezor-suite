// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangeLanguage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { UI, createUiMessage } from '../events';
import { Assert } from '@trezor/schema-utils';
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

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                customConfirmButton: {
                    className: 'confirm',
                    label: 'Proceed',
                },
                label: 'Do you want to change language?',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        return uiResp.payload;
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
