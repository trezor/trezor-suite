// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAddress.js

import { type BitcoinNetworkInfo, Bundle, type PROTO } from '@trezor/connect-common';
import { UI_REQUEST, createUiMessage } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { GetAddress as GetAddressSchema } from '@trezor/connect-common/src/types/api/getAddress';
import { Assert } from '@trezor/schema-utils';

import { bundlify, validateCoinPath } from './common/paramsValidator';
import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { fixCoinInfoNetwork, getBitcoinNetwork, getUniqueNetworks } from '../data/coinInfo';
import { getLabel, getSerializedPath, validatePath } from '../utils/pathUtils';

type Params = {
    proto: PROTO.GetAddress;
    address?: string;
    coinInfo: BitcoinNetworkInfo;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetAddress extends AbstractMethod<'getAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'getAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // Workaround to allow empty signature in multisig (issue #10841)
        payload.bundle.forEach(bundleElement => {
            if (bundleElement.multisig && bundleElement.multisig?.signatures === undefined) {
                bundleElement.multisig.signatures = Array(
                    bundleElement.multisig?.pubkeys.length,
                ).fill('');
            }
        });
        // validate bundle type
        Assert(Bundle(GetAddressSchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 1);
            let coinInfo: BitcoinNetworkInfo | undefined;
            if (batch.coin) {
                coinInfo = getBitcoinNetwork(batch.coin);
            }

            if (coinInfo && !batch.crossChain) {
                validateCoinPath(path, coinInfo);
            } else if (!coinInfo) {
                coinInfo = getBitcoinNetwork(path);
            }

            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }

            // fix coinInfo network values (segwit/legacy)
            coinInfo = fixCoinInfoNetwork(coinInfo, path);
            const proto = {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                multisig: batch.multisig,
                script_type: batch.scriptType,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };

            return {
                proto,
                address: batch.address,
                coinInfo,
                unlockPath: batch.unlockPath,
            };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.requiredFirmwareCoins = params.map(({ coinInfo }) => coinInfo);
        this.confirmMissingBackup = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        // set info
        if (this.params.length === 1) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const first: (typeof this.params)[number] = this.params[0];

            return getLabel('Export #NETWORK address', first.coinInfo);
        }
        const requestedNetworks = this.params.map(b => b.coinInfo);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
        }

        return 'Export multiple addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const current: (typeof this.params)[number] = this.params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(current.proto.address_n),
                address: current.address || 'not-set',
            };
        }
    }

    get confirmation() {
        return !this.useUi
            ? undefined
            : {
                  view: 'export-address' as const,
                  label: this.info,
              };
    }

    async _call({ proto, coinInfo, unlockPath }: Params) {
        const cmd = this.getDevice().getCommands();
        if (unlockPath) {
            await cmd.unlockPath(unlockPath);
        }

        const response = await cmd.getAddress(proto, coinInfo);

        return {
            path: proto.address_n,
            serializedPath: getSerializedPath(proto.address_n),
            address: response.address,
            mac: response.mac,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];
            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.proto.show_display) {
                const silent = await this._call({
                    ...batch,
                    proto: { ...batch.proto, show_display: false },
                });
                if (typeof batch.address === 'string') {
                    if (batch.address !== silent.address) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);
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

            this.progress++;
        }

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
