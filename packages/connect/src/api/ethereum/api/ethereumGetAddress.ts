// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetAddress.js

import { Bundle, GetAddress as GetAddressSchema } from '@trezor/connect-common';
import type { EthereumNetworkInfoDefinitionValues, PROTO } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { stripHexPrefix } from '../../../utils/formatUtils';
import { getSerializedPath, getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { AbstractGetAddress } from '../../common/AbstractGetAddress';
import { bundlify } from '../../common/paramsValidator';
import {
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
    getEthereumDefinitions,
} from '../ethereumDefinitions';

type Params = {
    proto: PROTO.EthereumGetAddress;
    address?: string;
    network?: EthereumNetworkInfoDefinitionValues;
};

type RunResponse = {
    path: number[];
    serializedPath: string;
    address: string;
    mac?: string;
};

export default class EthereumGetAddress extends AbstractGetAddress<
    'ethereumGetAddress',
    Params,
    RunResponse
> {
    constructor(message: MethodMessage<'ethereumGetAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        Assert(Bundle(GetAddressSchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);

            return {
                proto: {
                    address_n: path,
                    show_display:
                        typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                    chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
                },
                address: batch.address,
                network,
            };
        });

        super(message, params);

        this.requiredFirmwareCoins = params.map(({ network }) => network);
        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    async initAsync(): Promise<void> {
        for (let i = 0; i < this.params.length; i++) {
            if (!this.params[i].network) {
                const slip44 = getSlip44ByPath(this.params[i].proto.address_n);

                const definitions = await getEthereumDefinitions({ slip44 });

                const decoded = decodeEthereumDefinition(definitions);
                if (decoded.network) {
                    this.params[i].network = ethereumNetworkInfoFromDefinition(decoded.network);
                }
                if (definitions.encoded_network) {
                    this.params[i].proto.encoded_network = definitions.encoded_network;
                }
            }
        }
    }

    get info() {
        if (this.params.length === 1) {
            return getNetworkLabel('Export #NETWORK address', this.params[0].network);
        }
        const uniqNetworks = getUniqueNetworks(this.params.map(b => b.network));
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getNetworkLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
        }

        return 'Export multiple addresses';
    }

    get confirmation() {
        return {
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

    protected addressesEqual(requested: string, actual: string): boolean {
        return stripHexPrefix(requested).toLowerCase() === stripHexPrefix(actual).toLowerCase();
    }

    async _call(param: Params) {
        return await this.getDevice().getCommands().ethereumGetAddress(param.proto);
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
