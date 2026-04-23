import { create, toBinary } from '@bufbuild/protobuf';
import { hexToBytes } from '@noble/hashes/utils.js';

import type { TronContracts } from '@trezor/connect-common/src/types/api/tron';
import { protobufManager } from '@trezor/protobuf/src/bufbuild-loader';
import { TronRawContractType } from '@trezor/protobuf/src/definitions/messages-tron';

// DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX + A_SIGNATURE
export const TRON_BANDWIDTH_FORMULA_OVERHEAD = 3 + 64 + 67;

type BlockParams = {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
};

const contractTypeUrl = (name: string) => `type.googleapis.com/protocol.${name}`;

const getSchema = (name: string) => {
    if (!protobufManager) {
        throw new Error('ProtobufManager not initialized');
    }

    return protobufManager.findSchema(name).schema;
};

type InnerContract = { type: TronRawContractType; bytes: Uint8Array };

const encodeInnerContract = (contract: TronContracts): InnerContract => {
    switch (contract.type) {
        case 'TransferContract': {
            const { owner_address, to_address, amount } = contract.parameter.value;
            const schema = getSchema('TronTransferContract');

            return {
                type: TronRawContractType.TransferContract,
                bytes: toBinary(
                    schema,
                    create(schema, {
                        ownerAddress: hexToBytes(owner_address ?? ''),
                        toAddress: hexToBytes(to_address ?? ''),
                        amount: BigInt(amount ?? 0),
                    }),
                ),
            };
        }
        case 'TriggerSmartContract': {
            const { owner_address, contract_address, data } = contract.parameter.value;
            const schema = getSchema('TronTriggerSmartContract');

            return {
                type: TronRawContractType.TriggerSmartContract,
                bytes: toBinary(
                    schema,
                    create(schema, {
                        ownerAddress: hexToBytes(owner_address ?? ''),
                        contractAddress: hexToBytes(contract_address ?? ''),
                        data: hexToBytes(data ?? ''),
                    }),
                ),
            };
        }
        default:
            throw new Error(
                `Unsupported contract type for encoding: ${(contract as { type: string }).type}`,
            );
    }
};

export const encodeTronContractRawData = (
    contract: TronContracts,
    blockParams: BlockParams,
): Uint8Array => {
    const { type, bytes } = encodeInnerContract(contract);
    const { ref_block_bytes, ref_block_hash, expiration, timestamp, fee_limit } = blockParams;
    const schema = getSchema('TronRawTransaction');

    return toBinary(
        schema,
        create(schema, {
            refBlockBytes: hexToBytes(ref_block_bytes),
            refBlockHash: hexToBytes(ref_block_hash),
            expiration: BigInt(expiration),
            timestamp: BigInt(timestamp),
            // fee_limit is only valid for smart-contract calls; TRON ignores it on transfers.
            feeLimit: contract.type === 'TriggerSmartContract' ? BigInt(fee_limit ?? 0) : undefined,
            contract: [
                {
                    type,
                    parameter: {
                        typeUrl: contractTypeUrl(contract.type),
                        value: bytes,
                    },
                },
            ],
        }),
    );
};
