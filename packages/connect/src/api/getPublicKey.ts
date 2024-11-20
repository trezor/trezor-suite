// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetPublicKey.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { UI, createUiMessage } from '../events';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getPublicKeyLabel } from '../utils/accountUtils';
import type { BitcoinNetworkInfo } from '../types';
import type { PROTO } from '../constants';
import { Bundle } from '../types';
import { GetPublicKey as GetPublicKeySchema } from '../types/api/getPublicKey';

type Params = PROTO.GetPublicKey & {
    coinInfo?: BitcoinNetworkInfo;
    suppressBackupWarning?: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey', Params[]> {
    hasBundle?: boolean;

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
                // NOTE: Some 3rd parties are calling getPublicKey with non-bitcoin coins, like "ETH".
                // This is incorrect usage, but we need to keep backward compatibility.
                // So if no coin is provided, we will keep coinInfo undefined, which will
                // lead to getPublicKeyLabel returning a label based on the path
                coinInfo = getBitcoinNetwork(address_n); // ?? getBitcoinNetwork('btc')!;
            }

            // set required firmware from coinInfo support
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

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

        this.noBackupConfirmationMode = this.params.every(
            batch => batch.suppressBackupWarning || !batch.show_display,
        )
            ? 'popup-only'
            : 'always';
    }

    get info() {
        return 'Export public key';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple public keys'
                    : getPublicKeyLabel(this.params[0].address_n, this.params[0].coinInfo),
        };
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const { coinInfo, unlockPath, ...batch } = this.params[i];
            // if coinInfo is not provided, use fallback (see above in init method)
            const coinInfoFallback = coinInfo ?? getBitcoinNetwork('btc')!;
            const response = await cmd.getHDNode(batch, { coinInfo: coinInfoFallback, unlockPath });
            responses.push(response);

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
