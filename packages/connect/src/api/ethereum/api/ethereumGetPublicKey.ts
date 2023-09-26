// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
import { validatePath } from '../../../utils/pathUtils';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { UI, createUiMessage } from '../../../events';
import type { PROTO } from '../../../constants';
import type { EthereumNetworkInfo } from '../../../types';

type Params = PROTO.EthereumGetPublicKey & {
    network?: EthereumNetworkInfo;
};

export default class EthereumGetPublicKey extends AbstractMethod<'ethereumGetPublicKey', Params[]> {
    hasBundle?: boolean;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];

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
            const network = getEthereumNetwork(path);
            this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);
            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
                network,
            };
        });
    }

    get info() {
        // set info
        if (this.params.length === 1) {
            return getNetworkLabel('Export #NETWORK public key', this.params[0].network);
        }
        const requestedNetworks = this.params.map(b => b.network);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getNetworkLabel('Export multiple #NETWORK public keys', uniqNetworks[0]);
        }
        return 'Export multiple public keys';
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
                label: this.info,
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
            const response = await cmd.ethereumGetPublicKey({
                address_n: batch.address_n,
                show_display: batch.show_display,
            });
            responses.push(response);

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response,
                    }),
                );
            }
        }
        return this.hasBundle ? responses : responses[0];
    }
}
