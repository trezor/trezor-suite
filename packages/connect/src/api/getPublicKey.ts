// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { UI, createUiMessage } from '../events';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getPublicKeyLabel } from '../utils/accountUtils';
import type { BitcoinNetworkInfo } from '../types';
import type { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';
import { Bundle } from '../types';
import { GetPublicKey as GetPublicKeySchema } from '../types/api/getPublicKey';

type Params = PROTO.GetPublicKey & {
    coinInfo?: BitcoinNetworkInfo;
    suppressBackupWarning?: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey', Params[]> {
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
        Assert(Bundle(GetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
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
                suppress_backup_warning: batch.suppressBackupWarning,
            };
        });
    }

    get info() {
        return 'Export public key';
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

    async noBackupConfirmation(allowSuppression?: boolean) {
        if (
            allowSuppression &&
            this.params.every(batch => batch.suppressBackupWarning || !batch.show_display)
        ) {
            return true;
        }
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'no-backup',
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
