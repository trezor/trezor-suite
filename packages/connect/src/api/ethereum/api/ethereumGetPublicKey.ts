// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetPublicKey.js

import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import {
    AbstractMethod,
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { UI_REQUEST, createUiMessage } from '../../../events';
import type { EthereumNetworkInfo } from '../../../types';
import { Bundle, GetPublicKey as GetPublicKeySchema } from '../../../types';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

type Params = PROTO.EthereumGetPublicKey & {
    network?: EthereumNetworkInfo;
};

export default class EthereumGetPublicKey extends AbstractMethod<'ethereumGetPublicKey', Params[]> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'ethereumGetPublicKey'>, context: MethodContext) {
        super(message, context);
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);
            this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
                network,
            };
        });
    }

    get info() {
        // set info
        if (this.params.length === 1) {
            return getNetworkLabel('Export #NETWORK public key', this.params[0].network);
        }
        const requestedNetworks = this.params.map(b => b.network);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getNetworkLabel('Export multiple #NETWORK public keys', uniqNetworks[0]);
        }

        return 'Export multiple public keys';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label: this.info,
        };
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();

        for (let i = 0; i < this.params.length; i++) {
            const { address_n, show_display } = this.params[i];

            const publicKey = await cmd.ethereumGetPublicKey({ address_n, show_display });

            const response = {
                path: address_n,
                serializedPath: getSerializedPath(address_n),
                childNum: publicKey.node.child_num,
                xpub: publicKey.xpub,
                chainCode: publicKey.node.chain_code,
                publicKey: publicKey.node.public_key,
                fingerprint: publicKey.node.fingerprint,
                depth: publicKey.node.depth,
            };

            responses.push(response);

            if (this.hasBundle) {
                // send progress
                this.postMessage(
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
