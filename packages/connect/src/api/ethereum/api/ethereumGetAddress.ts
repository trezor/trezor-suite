// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetAddress.js

import {
    Bundle,
    type EthereumNetworkInfoDefinitionValues,
    GetAddress as GetAddressSchema,
    type PROTO,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { stripHexPrefix } from '../../../utils/formatUtils';
import { getSerializedPath, getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { bundlify, getFirmwareRange } from '../../common/paramsValidator';
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

export default class EthereumGetAddress extends AbstractMethod<'ethereumGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'ethereumGetAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetAddressSchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);

            const proto = {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };

            return { proto, address: batch.address, network };
        });

        super(message, params);

        this.firmwareRange = params.reduce(
            (prev, { network }) => getFirmwareRange(this.name, network, prev),
            this.firmwareRange,
        );
        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    async initAsync(): Promise<void> {
        for (let i = 0; i < this.params.length; i++) {
            // network was maybe already set from 'well-known' definition in init method.
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
        const requestedNetworks = this.params.map(b => b.network);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getNetworkLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
        }

        return 'Export multiple addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(this.params[this.progress].proto.address_n),
                address: this.params[this.progress].address || 'not-set',
            };
        }
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label: this.info,
        };
    }

    private async _call(params: Params) {
        const response = await this.getDevice().getCommands().ethereumGetAddress(params.proto);

        return {
            path: params.proto.address_n,
            serializedPath: getSerializedPath(params.proto.address_n),
            address: response.address,
            mac: response.mac,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.proto.show_display) {
                const silent = await this._call({
                    ...batch,
                    proto: { ...batch.proto, show_display: false },
                });
                if (typeof batch.address === 'string') {
                    if (
                        stripHexPrefix(batch.address).toLowerCase() !==
                        stripHexPrefix(silent.address).toLowerCase()
                    ) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    // save address for future verification in "getButtonRequestData"
                    batch.address = silent.address;
                }
            }

            const response = await this._call({
                ...batch,
            });
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

        return this.hasBundle ? responses : responses[0];
    }
}
