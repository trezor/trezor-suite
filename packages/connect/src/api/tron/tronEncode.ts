import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { tronUtils } from '@trezor/blockchain-link-utils';

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
    const ownerBytes = tronUtils.tronAddressToBytes(from);
    const toBytes = tronUtils.tronAddressToBytes(to);
    if (!ownerBytes || !toBytes) throw new Error('Invalid Tron address checksum.');

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
    const ownerBytes = tronUtils.tronAddressToBytes(from);
    const contractAddressBytes = tronUtils.tronAddressToBytes(contractAddress);
    if (!ownerBytes || !contractAddressBytes) throw new Error('Invalid Tron address checksum.');

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
const TRON_BANDWIDTH_FORMULA_OVERHEAD = 3 + 64 + 67;

const TRON_DUMMY_ADDRESS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'; // Tron zero address
const TRON_DUMMY_BLOCK_BYTES = '0000';
const TRON_DUMMY_BLOCK_HASH = '0000000000000000';
const TRON_DUMMY_TIMESTAMP = 1700000000000;

export const estimateTronTransferBandwidth = (amountInSun: string): number => {
    const rawData = encodeTransferRawData({
        from: TRON_DUMMY_ADDRESS,
        to: TRON_DUMMY_ADDRESS,
        amount: amountInSun,
        refBlockBytes: TRON_DUMMY_BLOCK_BYTES,
        refBlockHash: TRON_DUMMY_BLOCK_HASH,
        expiration: TRON_DUMMY_TIMESTAMP + 3_600_000,
        timestamp: TRON_DUMMY_TIMESTAMP,
    });

    return rawData.length + TRON_BANDWIDTH_FORMULA_OVERHEAD;
};

export const estimateTronTrc20Bandwidth = (feeLimitInSun: string): number => {
    const rawData = encodeTriggerSmartContractRawData({
        from: TRON_DUMMY_ADDRESS,
        contractAddress: TRON_DUMMY_ADDRESS,
        data: '00'.repeat(68), // TRC-20 transfer calldata is always 68 bytes
        refBlockBytes: TRON_DUMMY_BLOCK_BYTES,
        refBlockHash: TRON_DUMMY_BLOCK_HASH,
        expiration: TRON_DUMMY_TIMESTAMP + 3_600_000,
        timestamp: TRON_DUMMY_TIMESTAMP,
        feeLimit: Number(feeLimitInSun),
    });

    return rawData.length + TRON_BANDWIDTH_FORMULA_OVERHEAD;
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
