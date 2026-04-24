// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAddress.js

import { type BitcoinNetworkInfo, Bundle, type PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { GetAddress as GetAddressSchema } from '@trezor/connect-common/src/types/api/getAddress';
import { Assert } from '@trezor/schema-utils';

import { AbstractGetAddress } from './common/AbstractGetAddress';
import { bundlify, validateCoinPath } from './common/paramsValidator';
import type { MethodMessage } from '../core/AbstractMethod';
import { fixCoinInfoNetwork, getBitcoinNetwork, getUniqueNetworks } from '../data/coinInfo';
import { getLabel, getSerializedPath, validatePath } from '../utils/pathUtils';

type Params = {
    proto: PROTO.GetAddress;
    address?: string;
    coinInfo: BitcoinNetworkInfo;
    unlockPath?: PROTO.UnlockPath;
};

type RunResponse = {
    path: number[];
    serializedPath: string;
    address: string;
    mac?: string;
};

export default class GetAddress extends AbstractGetAddress<'getAddress', Params, RunResponse> {
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
        Assert(Bundle(GetAddressSchema), payload);

        const params: Params[] = payload.bundle.map(batch => {
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

            coinInfo = fixCoinInfoNetwork(coinInfo, path);

            return {
                proto: {
                    address_n: path,
                    show_display:
                        typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                    multisig: batch.multisig,
                    script_type: batch.scriptType,
                    chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
                },
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

    get info() {
        if (this.params.length === 1) {
            return getLabel('Export #NETWORK address', this.params[0].coinInfo);
        }
        const uniqNetworks = getUniqueNetworks(this.params.map(b => b.coinInfo));
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
        }

        return 'Export multiple addresses';
    }

    get confirmation() {
        return !this.useUi
            ? undefined
            : {
                  view: 'export-address' as const,
                  label: this.info,
              };
    }

    protected getAddressN(param: Params) {
        return param.proto.address_n;
    }

    protected getShowDisplay(param: Params) {
        return param.proto.show_display ?? false;
    }

    protected paramForSilent(param: Params) {
        return { ...param, proto: { ...param.proto, show_display: false } };
    }

    protected getPreviousAddress(param: Params) {
        return param.address;
    }

    protected setPreviousAddress(param: Params, address: string) {
        param.address = address;
    }

    async _call({ proto, coinInfo, unlockPath }: Params) {
        const cmd = this.getDevice().getCommands();
        if (unlockPath) {
            await cmd.unlockPath(unlockPath);
        }

        return await cmd.getAddress(proto, coinInfo);
    }

    protected buildRunResponse(
        param: Params,
        response: { address: string; mac?: string },
    ): RunResponse {
        return {
            path: param.proto.address_n,
            serializedPath: getSerializedPath(param.proto.address_n),
            address: response.address,
            mac: response.mac,
        };
    }
}
