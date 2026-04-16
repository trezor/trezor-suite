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

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { bundlify, validateCoinPath } from './common/paramsValidator';
import { getPublicKeyLabel } from '../utils/accountUtils';
import { validatePath } from '../utils/pathUtils';

type Params = {
    proto: PROTO.GetPublicKey;
    coinInfo?: BitcoinNetworkInfo;
    suppressBackupWarning?: boolean;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetPublicKey extends AbstractMethod<'getPublicKey', Params[]> {
    constructor(message: MethodMessage<'getPublicKey'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        const params = payload.bundle.map(batch => {
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

        super(message, params);

        this.requiredFirmwareCoins = params.map(({ coinInfo }) => coinInfo);
        this.hasBundle = hasBundle;
        this.confirmMissingBackup = !this.params.every(
            batch => batch.suppressBackupWarning || !batch.proto.show_display,
        );
    }

    hasBundle?: boolean;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export public key';
    }

    get confirmation() {
        if (this.params.length > 1) {
            return {
                view: 'export-xpub' as const,
                label: 'Export multiple public keys',
            };
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof this.params)[number] = this.params[0];

        return {
            view: 'export-xpub' as const,
            label: getPublicKeyLabel(first.proto.address_n, first.coinInfo),
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];
            const { coinInfo, unlockPath, proto } = batch;
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

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
