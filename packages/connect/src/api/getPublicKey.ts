// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateParams, validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { UI, createUiMessage } from '../events';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getPublicKeyLabel } from '../utils/accountUtils';
import type { BitcoinNetworkInfo } from '../types';
import type { PROTO } from '../constants';

type Params = PROTO.GetPublicKey & {
    coinInfo?: BitcoinNetworkInfo;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey', Params[]> {
    hasBundle?: boolean;
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

        this.params = payload.bundle.map(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'path', required: true },
                { name: 'coin', type: 'string' },
                { name: 'crossChain', type: 'boolean' },
                { name: 'showOnTrezor', type: 'boolean' },
                { name: 'scriptType', type: ['string', 'number'] },
                { name: 'ignoreXpubMagic', type: 'boolean' },
                { name: 'ecdsaCurveName', type: 'boolean' },
                { name: 'unlockPath', type: 'object' },
            ]);

            if (batch.unlockPath) {
                validateParams(batch.unlockPath, [
                    { name: 'address_n', required: true, type: 'array' },
                    { name: 'mac', required: true, type: 'string' },
                ]);
            }

            let coinInfo: BitcoinNetworkInfo | undefined;
            if (batch.coin) {
                coinInfo = getBitcoinNetwork(batch.coin);
            }

            const address_n = validatePath(batch.path, coinInfo ? 3 : 0);
            if (coinInfo && !batch.crossChain) {
                validateCoinPath(address_n, coinInfo);
            } else if (!coinInfo) {
                coinInfo = getBitcoinNetwork(address_n);
            }

            // set required firmware from coinInfo support
            if (coinInfo) {
                this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
            }

            return {
                address_n,
                coin_name: coinInfo?.name,
                show_display: batch.showOnTrezor,
                script_type: batch.scriptType,
                ignore_xpub_magic: batch.ignoreXpubMagic,
                ecdsa_curve_name: batch.ecdsaCurveName,
                coinInfo,
                unlockPath: batch.unlockPath,
            };
        });
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);
        let label: string;
        if (this.params.length > 1) {
            label = 'Export multiple public keys';
        } else {
            label = getPublicKeyLabel(this.params[0].address_n, this.params[0].coinInfo);
        }

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
                label,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async noBackupConfirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'get-public-key-no-backup',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const { coinInfo, unlockPath, ...batch } = this.params[i];
            const response = await cmd.getHDNode(batch, { coinInfo, unlockPath });
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
