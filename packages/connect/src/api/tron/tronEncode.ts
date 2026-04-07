import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import type { TronContracts } from '@trezor/connect-common/src/types/api/tron';

import {
    AnyType,
    CONTRACT_TYPE_TRANSFER,
    CONTRACT_TYPE_TRIGGER_SMART_CONTRACT,
    TRANSFER_CONTRACT_TYPE_URL,
    TRIGGER_SMART_CONTRACT_TYPE_URL,
    TransactionRawType,
    TransactionType,
    TransferContractType,
    TriggerSmartContractType,
} from './tronProtobuf';

export type EncodeTransferRawDataParams = {
    from: string;
    to: string;
    amount: string; // in SUN
    refBlockBytes: string;
    refBlockHash: string;
    expiration: number;
    timestamp: number;
};

export const encodeTransferRawData = ({
    from,
    to,
    amount,
    refBlockBytes,
    refBlockHash,
    expiration,
    timestamp,
}: EncodeTransferRawDataParams): Uint8Array => {
    const ownerBytes = hexToBytes(from);
    const toBytes = hexToBytes(to);

    const contractBytes = TransferContractType.encode(
        TransferContractType.fromObject({
            ownerAddress: Buffer.from(ownerBytes),
            toAddress: Buffer.from(toBytes),
            amount,
        }),
    ).finish();

    return TransactionRawType.encode(
        TransactionRawType.fromObject({
            refBlockBytes: Buffer.from(hexToBytes(refBlockBytes)),
            refBlockHash: Buffer.from(hexToBytes(refBlockHash)),
            expiration,
            timestamp,
            contract: [
                {
                    type: CONTRACT_TYPE_TRANSFER,
                    parameter: AnyType.fromObject({
                        typeUrl: TRANSFER_CONTRACT_TYPE_URL,
                        value: Buffer.from(contractBytes),
                    }),
                },
            ],
        }),
    ).finish();
};

export type EncodeTriggerSmartContractRawDataParams = {
    from: string;
    contractAddress: string;
    data: string; // calldata hex (without 0x)
    refBlockBytes: string;
    refBlockHash: string;
    expiration: number;
    timestamp: number;
    feeLimit: number;
};

export const encodeTriggerSmartContractRawData = ({
    from,
    contractAddress,
    data,
    refBlockBytes,
    refBlockHash,
    expiration,
    timestamp,
    feeLimit,
}: EncodeTriggerSmartContractRawDataParams): Uint8Array => {
    const ownerBytes = hexToBytes(from);
    const contractAddressBytes = hexToBytes(contractAddress);

    const contractBytes = TriggerSmartContractType.encode(
        TriggerSmartContractType.fromObject({
            ownerAddress: Buffer.from(ownerBytes),
            contractAddress: Buffer.from(contractAddressBytes),
            data: Buffer.from(hexToBytes(data)),
        }),
    ).finish();

    return TransactionRawType.encode(
        TransactionRawType.fromObject({
            refBlockBytes: Buffer.from(hexToBytes(refBlockBytes)),
            refBlockHash: Buffer.from(hexToBytes(refBlockHash)),
            expiration,
            timestamp,
            feeLimit,
            contract: [
                {
                    type: CONTRACT_TYPE_TRIGGER_SMART_CONTRACT,
                    parameter: AnyType.fromObject({
                        typeUrl: TRIGGER_SMART_CONTRACT_TYPE_URL,
                        value: Buffer.from(contractBytes),
                    }),
                },
            ],
        }),
    ).finish();
};

// DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX + A_SIGNATURE
export const TRON_BANDWIDTH_FORMULA_OVERHEAD = 3 + 64 + 67;

type BlockParams = {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
};

export const encodeTronContractRawData = (
    contract: TronContracts,
    blockParams: BlockParams,
): Uint8Array => {
    const { ref_block_bytes, ref_block_hash, expiration, timestamp, fee_limit } = blockParams;

    switch (contract.type) {
        case 'TransferContract': {
            const { owner_address, to_address, amount } = contract.parameter.value;

            return encodeTransferRawData({
                from: owner_address ?? '',
                to: to_address ?? '',
                amount: String(amount ?? 0),
                refBlockBytes: ref_block_bytes,
                refBlockHash: ref_block_hash,
                expiration,
                timestamp,
            });
        }
        case 'TriggerSmartContract': {
            const { owner_address, contract_address, data } = contract.parameter.value;

            return encodeTriggerSmartContractRawData({
                from: owner_address ?? '',
                contractAddress: contract_address ?? '',
                data: data ?? '',
                refBlockBytes: ref_block_bytes,
                refBlockHash: ref_block_hash,
                expiration,
                timestamp,
                feeLimit: fee_limit ?? 0,
            });
        }
        default:
            throw new Error(
                `Unsupported contract type for encoding: ${(contract as { type: string }).type}`,
            );
    }
};

export const encodeBroadcastTransaction = (rawDataHex: string, signatureHex: string): string =>
    bytesToHex(
        TransactionType.encode(
            TransactionType.fromObject({
                rawData: Buffer.from(hexToBytes(rawDataHex)),
                signature: [Buffer.from(hexToBytes(signatureHex))],
            }),
        ).finish(),
    );
