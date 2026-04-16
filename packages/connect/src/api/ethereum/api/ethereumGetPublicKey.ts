// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetPublicKey.js
import {
    Bundle,
    type EthereumNetworkInfo,
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
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { bundlify } from '../../common/paramsValidator';

type Params = {
    proto: PROTO.EthereumGetPublicKey;
    network?: EthereumNetworkInfo;
};

export default class EthereumGetPublicKey extends AbstractMethod<'ethereumGetPublicKey', Params[]> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'ethereumGetPublicKey'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);

            const proto = {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
            };

            return { proto, network };
        });

        super(message, params);

        this.requiredFirmwareCoins = params.map(({ network }) => network);
        this.hasBundle = hasBundle;
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        // set info
        if (this.params.length === 1) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const first: (typeof this.params)[number] = this.params[0];

            return getNetworkLabel('Export #NETWORK public key', first.network);
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

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();

        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];
            const { address_n, show_display } = batch.proto;

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
