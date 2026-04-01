import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { Assert, Optional, Type } from '@trezor/schema-utils';

import {
    CONTRACT_TYPE_TRANSFER,
    CONTRACT_TYPE_TRIGGER_SMART_CONTRACT,
    TransactionRawType,
    TransferContractType,
    TriggerSmartContractType,
} from './tronProtobuf';
import { type TronContracts } from '../../types/api/tron';

const DecodedTransferContractSchema = Type.Object({
    ownerAddress: Type.Uint8Array(),
    toAddress: Type.Uint8Array(),
    amount: Type.Number(),
});

const DecodedTriggerSmartContractSchema = Type.Object({
    ownerAddress: Type.Uint8Array(),
    contractAddress: Type.Uint8Array(),
    data: Type.Uint8Array(),
});

const DecodedTransactionRawSchema = Type.Object({
    refBlockBytes: Type.Uint8Array(),
    refBlockHash: Type.Uint8Array(),
    expiration: Type.Number(),
    timestamp: Type.Number(),
    feeLimit: Optional(Type.Number()),
    contract: Type.Array(
        Type.Object({
            type: Type.Number(),
            parameter: Type.Object({ value: Type.Uint8Array() }),
        }),
    ),
});

export type ParsedTronTransaction = {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
    contract: TronContracts[];
};

export const parseTronTransaction = (rawDataHex: string): ParsedTronTransaction => {
    const decoded = TransactionRawType.decode(hexToBytes(rawDataHex));
    const rawData = TransactionRawType.toObject(decoded, {
        longs: Number,
    });
    Assert(DecodedTransactionRawSchema, rawData);

    const contract: TronContracts[] = rawData.contract.map(c => {
        const paramValue = c.parameter.value;

        switch (c.type) {
            case CONTRACT_TYPE_TRANSFER: {
                const decodedTransfer = TransferContractType.decode(paramValue);
                const transfer = TransferContractType.toObject(decodedTransfer, {
                    longs: Number,
                    bytes: Buffer,
                });
                Assert(DecodedTransferContractSchema, transfer);

                return {
                    type: 'TransferContract' as const,
                    parameter: {
                        value: {
                            owner_address: bytesToHex(transfer.ownerAddress),
                            to_address: bytesToHex(transfer.toAddress),
                            amount: transfer.amount.toString(),
                        },
                    },
                };
            }
            case CONTRACT_TYPE_TRIGGER_SMART_CONTRACT: {
                const decodedTrigger = TriggerSmartContractType.decode(paramValue);
                const trigger = TriggerSmartContractType.toObject(decodedTrigger, {
                    longs: Number,
                    bytes: Buffer,
                });
                Assert(DecodedTriggerSmartContractSchema, trigger);

                return {
                    type: 'TriggerSmartContract' as const,
                    parameter: {
                        value: {
                            owner_address: bytesToHex(trigger.ownerAddress),
                            contract_address: bytesToHex(trigger.contractAddress),
                            data: bytesToHex(trigger.data),
                        },
                    },
                };
            }
            default:
                throw new Error(`Unsupported Tron contract type: ${c.type}`);
        }
    });

    return {
        ref_block_bytes: bytesToHex(rawData.refBlockBytes),
        ref_block_hash: bytesToHex(rawData.refBlockHash),
        expiration: rawData.expiration,
        timestamp: rawData.timestamp,
        fee_limit: rawData.feeLimit ?? undefined,
        contract,
    };
};
