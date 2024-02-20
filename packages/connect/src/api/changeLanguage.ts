// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ChangeLanguage.js

import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { Assert } from '@trezor/schema-utils';
import { ChangeLanguage as ChangeLanguageSchema } from '../types/api/changeLanguage';
import { httpRequest } from '../utils/assets';

export default class ChangeLanguage extends AbstractMethod<'changeLanguage', ChangeLanguageSchema> {
    init() {
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;

        const { payload } = this;

        Assert(ChangeLanguageSchema, payload);

        if (payload.binary) {
            this.params = {
                binary: payload.binary,
            };
        } else {
            this.params = {
                language: payload.language,
                baseUrl: payload.baseUrl || 'https://data.trezor.io',
            };
        }
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

    private async uploadTranslationData(payload: ArrayBuffer) {
        const length = payload.byteLength;
        if (!this.device.commands) {
            throw ERRORS.TypedError('Runtime', 'uploadTranslationData: device.commands is not set');
        }
        let response = await this.device.commands.typedCall(
            'ChangeLanguage',
            ['TranslationDataRequest', 'Success'],
            {
                data_length: length,
            },
        );
        while (response.type !== 'Success') {
            const start = response.message.data_offset!;
            const end = response.message.data_offset! + response.message.data_length!;
            const chunk = payload.slice(start, end);

            response = await this.device.commands.typedCall(
                'TranslationDataAck',
                ['TranslationDataRequest', 'Success'],
                {
                    data_chunk: Buffer.from(chunk).toString('hex'),
                },
            );
        }
        return response.message;
    }

    async run() {
        const { language, binary, baseUrl } = this.params;

        if (binary) {
            return this.uploadTranslationData(binary);
        }

        const version = this.device.getVersion().join('.');
        const model = this.device.features.internal_model;

        // todo: signed?
        const url = `${baseUrl}/data/translations/translation-${model}-${language}-${version}-unsigned.bin`;

        // todo: does it throw?
        const downloadedBinary = await httpRequest(url, 'binary');

        return this.uploadTranslationData(downloadedBinary);
    }
}
