// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/FirmwareUpdate.js

import { randomBytes } from 'crypto';
import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import {
    getBinary,
    shouldStripFwHeaders,
    stripFwHeaders,
    uploadFirmware,
    calculateFirmwareHash,
} from './firmware';
import { getReleases } from '../data/firmwareInfo';
import { IntermediaryVersion } from '../types';
import { Assert } from '@trezor/schema-utils';
import { FirmwareUpdate as FirmwareUpdateSchema } from '../types/api/firmwareUpdate';

type Params = {
    binary?: ArrayBuffer;
    version?: number[];
    btcOnly?: boolean;
    baseUrl: string;
    intermediaryVersion?: IntermediaryVersion;
};

export default class FirmwareUpdate extends AbstractMethod<'firmwareUpdate', Params> {
    init() {
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.allowDeviceMode = [UI.BOOTLOADER, UI.INITIALIZE];
        this.requireDeviceMode = [UI.BOOTLOADER];
        this.useDeviceState = false;
        this.skipFirmwareCheck = true;

        const { payload } = this;

        Assert(FirmwareUpdateSchema, payload);

        if (payload.binary) {
            this.params = {
                ...this.params,
                binary: payload.binary,
            };
        } else {
            this.params = {
                // either receive version and btcOnly
                version: payload.version,
                btcOnly: payload.btcOnly,
                baseUrl: payload.baseUrl || 'https://data.trezor.io',
                intermediaryVersion: payload.intermediaryVersion,
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
                    className: 'wipe',
                    label: 'Proceed',
                },
                label: 'Do you want to update firmware? Never do this without your recovery card.',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        return uiResp.payload;
    }

    async run() {
        const { device, params } = this;

        let binary: ArrayBuffer;
        try {
            if (params.binary) {
                binary = params.binary;
            } else {
                binary = await getBinary({
                    // features and releases are used for sanity checking
                    features: device.features,
                    releases: getReleases(device.features?.internal_model),
                    // version argument is used to find and fetch concrete release from releases list
                    version: params.version,
                    btcOnly: params.btcOnly,
                    baseUrl: params.baseUrl!,
                    intermediaryVersion: params.intermediaryVersion,
                });
            }
        } catch (err) {
            throw ERRORS.TypedError(
                'Method_FirmwareUpdate_DownloadFailed',
                `Failed to download firmware binary ${err.message}`,
            );
        }

        // Might not be installed, but needed for calculateFirmwareHash anyway
        const stripped = stripFwHeaders(binary);

        await uploadFirmware(
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
            this.postMessage,
            device,
            { payload: shouldStripFwHeaders(device.features) ? stripped : binary },
        );

        return calculateFirmwareHash(device.features.major_version, stripped, randomBytes(32));
    }
}
