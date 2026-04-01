import { bytesToHex } from '@noble/hashes/utils.js';

import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { TronComposeTransaction as TronComposeTransactionSchema } from '../../../types/api/tron';
import { encodeTransferRawData, encodeTriggerSmartContractRawData } from '../tronEncode';

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
        const { from, to, amount, blockHash, blockHeight, token } = this.params;

        const ref_block_bytes = blockHeight.toString(16).padStart(16, '0').slice(12, 16);
        const ref_block_hash = blockHash.replace(/^0x/, '').slice(16, 32);

        const timestamp = Date.now();
        const expiration = timestamp + 60 * 60 * 1000; // 1 hour

        const rawData = token
            ? encodeTriggerSmartContractRawData({
                  from,
                  contractAddress: token.contract,
                  data: token.data,
                  refBlockBytes: ref_block_bytes,
                  refBlockHash: ref_block_hash,
                  expiration,
                  timestamp,
                  feeLimit: token.feeLimit ?? 0,
              })
            : encodeTransferRawData({
                  from,
                  to,
                  amount,
                  refBlockBytes: ref_block_bytes,
                  refBlockHash: ref_block_hash,
                  expiration,
                  timestamp,
              });

        return {
            rawDataHex: bytesToHex(rawData),
            ref_block_bytes,
            ref_block_hash,
            expiration,
            timestamp,
        };
    }
}
