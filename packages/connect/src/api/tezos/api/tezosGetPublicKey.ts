// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosGetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath, fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { UI, createUiMessage } from '../../../events';
import type { PROTO } from '../../../constants';

export default class TezosGetPublicKey extends AbstractMethod<
    'tezosGetPublicKey',
    PROTO.TezosGetPublicKey[]
> {
    hasBundle?: boolean;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Tezos'),
            this.firmwareRange,
        );

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        this.params = payload.bundle.map(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'path', required: true },
                { name: 'showOnTrezor', type: 'boolean' },
            ]);

            const path = validatePath(batch.path, 3);
            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
            };
        });
    }

    get info() {
        return 'Export Tezos public key';
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        let label: string;
        if (this.params.length > 1) {
            label = 'Export multiple Tezos public keys';
        } else {
            label = `Export Tezos public key for account #${
                fromHardened(this.params[0].address_n[2]) + 1
            }`;
        }

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-address',
                label,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            const { message } = await cmd.typedCall('TezosGetPublicKey', 'TezosPublicKey', batch);
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.public_key,
            });

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response: message,
                    }),
                );
            }
        }
        return this.hasBundle ? responses : responses[0];
    }
}
