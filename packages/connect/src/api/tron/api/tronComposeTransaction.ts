import { bytesToHex } from '@noble/hashes/utils.js';

import { TronComposeTransaction as TronComposeTransactionSchema } from '@trezor/connect-common/src/types/api/tron';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { TRON_BANDWIDTH_FORMULA_OVERHEAD, encodeTronContractRawData } from '../tronEncode';

export default class TronComposeTransaction extends AbstractMethod<
    'tronComposeTransaction',
    TronComposeTransactionSchema
> {
    constructor(message: MethodMessage<'tronComposeTransaction'>) {
        super(message);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
        const { payload } = this;

        Assert(TronComposeTransactionSchema, payload);

        this.params = payload;
    }

    get info() {
        return 'Compose Tron transaction';
    }

    // eslint-disable-next-line require-await
    async run() {
        const { contract, blockHash, blockHeight, fee_limit } = this.params;

        const ref_block_bytes = blockHeight.toString(16).padStart(16, '0').slice(12, 16);
        const ref_block_hash = blockHash.replace(/^0x/, '').slice(16, 32);

        const timestamp = Date.now();
        const expiration = timestamp + 60 * 60 * 1000; // 1 hour

        const rawData = encodeTronContractRawData(contract, {
            ref_block_bytes,
            ref_block_hash,
            expiration,
            timestamp,
            fee_limit,
        });

        return {
            rawDataHex: bytesToHex(rawData),
            ref_block_bytes,
            ref_block_hash,
            expiration,
            timestamp,
            bandwidth: rawData.length + TRON_BANDWIDTH_FORMULA_OVERHEAD,
        };
    }
}
