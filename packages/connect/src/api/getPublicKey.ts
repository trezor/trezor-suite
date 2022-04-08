// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateParams, validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { UI, UiMessage } from '../events';
import { getBitcoinNetwork } from '../data/CoinInfo';
import { getPublicKeyLabel } from '../utils/accountUtils';
import type { BitcoinNetworkInfo } from '../types';
import type { PROTO } from '../constants';

type Params = PROTO.GetPublicKey & {
    coinInfo?: BitcoinNetworkInfo;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey'> {
    params: Params[] = [];

    hasBundle: boolean;

    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.info = 'Export public key';

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        payload.bundle.forEach(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'path', required: true },
                { name: 'coin', type: 'string' },
                { name: 'crossChain', type: 'boolean' },
                { name: 'showOnTrezor', type: 'boolean' },
            ]);

            let coinInfo: BitcoinNetworkInfo | undefined;
            if (batch.coin) {
                coinInfo = getBitcoinNetwork(batch.coin);
            }

            const path = validatePath(batch.path, coinInfo ? 3 : 0);
            if (coinInfo && !batch.crossChain) {
                validateCoinPath(coinInfo, path);
            } else if (!coinInfo) {
                coinInfo = getBitcoinNetwork(path);
            }

            this.params.push({
                address_n: path,
                coinInfo,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
            });

            // set required firmware from coinInfo support
            if (coinInfo) {
                this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
            }
        });
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);
        let label: string;
        if (this.params.length > 1) {
            label = 'Export multiple public keys';
        } else {
            label = getPublicKeyLabel(this.params[0].address_n, this.params[0].coinInfo);
        }

        // request confirmation view
        this.postMessage(
            UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
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
            const response = await cmd.getHDNode(
                batch.address_n,
                batch.coinInfo,
                true,
                batch.show_display,
            );
            responses.push(response);

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    UiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response,
                    }),
                );
            }
        }
        return this.hasBundle ? responses : responses[0];
    }
}
