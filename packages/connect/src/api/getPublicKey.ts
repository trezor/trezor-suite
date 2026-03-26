// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetPublicKey.js

import type { BitcoinNetworkInfo } from '@trezor/connect-common';
import {
    Bundle,
    GetPublicKey as GetPublicKeySchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodContext, MethodPermission, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { bundlify, getFirmwareRange, validateCoinPath } from './common/paramsValidator';
import { getPublicKeyLabel } from '../utils/accountUtils';
import { validatePath } from '../utils/pathUtils';

type Params = {
    proto: PROTO.GetPublicKey;
    coinInfo?: BitcoinNetworkInfo;
    suppressBackupWarning?: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey', Params[]> {
    hasBundle?: boolean;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { hasBundle, payload } = bundlify(this.payload);
        this.hasBundle = hasBundle;

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

            const proto = {
                address_n,
                coin_name: coinInfo?.name,
                show_display: batch.showOnTrezor,
                script_type: batch.scriptType,
                ignore_xpub_magic: batch.ignoreXpubMagic,
                ecdsa_curve_name: batch.ecdsaCurveName,
            };

            return {
                proto,
                coinInfo,
                unlockPath: batch.unlockPath,
                suppressBackupWarning: batch.suppressBackupWarning,
            };
        });

        this.confirmMissingBackup = !this.params.every(
            batch => batch.suppressBackupWarning || !batch.proto.show_display,
        );
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
                    : getPublicKeyLabel(this.params[0].proto.address_n, this.params[0].coinInfo),
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const { coinInfo, unlockPath, proto } = this.params[i];
            // if coinInfo is not provided, use fallback (see above in init method)
            const coinInfoFallback = coinInfo ?? getBitcoinNetwork('btc')!;
            const response = await cmd.getHDNode(proto, { coinInfo: coinInfoFallback, unlockPath });
            responses.push(response);

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
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
