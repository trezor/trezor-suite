import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { tronUtils } from '@trezor/blockchain-link-utils';
import { parseConfigure } from '@trezor/protobuf';

const TRON_CHAIN_SCHEMA = {
    nested: {
        protocol: {
            nested: {
                // Defined under `protocol` (not `google.protobuf`) to avoid protobufjs
                // well-known-type special-casing; wire format is identical.
                Any: {
                    fields: {
                        typeUrl: { type: 'string', id: 1 },
                        value: { type: 'bytes', id: 2 },
                    },
                },
                TransferContract: {
                    fields: {
                        ownerAddress: { type: 'bytes', id: 1 },
                        toAddress: { type: 'bytes', id: 2 },
                        amount: { type: 'int64', id: 3 },
                    },
                },
                TriggerSmartContract: {
                    fields: {
                        ownerAddress: { type: 'bytes', id: 1 },
                        contractAddress: { type: 'bytes', id: 2 },
                        data: { type: 'bytes', id: 4 },
                    },
                },
                Contract: {
                    fields: {
                        type: { type: 'int32', id: 1 },
                        parameter: { type: 'Any', id: 2 },
                    },
                },
                TransactionRaw: {
                    fields: {
                        refBlockBytes: { type: 'bytes', id: 1 },
                        refBlockHash: { type: 'bytes', id: 4 },
                        expiration: { type: 'int64', id: 8 },
                        contract: { rule: 'repeated', type: 'Contract', id: 11 },
                        timestamp: { type: 'int64', id: 14 },
                        feeLimit: { type: 'int64', id: 18 },
                    },
                },
                // rawData is typed as `bytes` (not TransactionRaw) because we receive it
                // pre-encoded from the firmware. bytes and a nested message share the same
                // length-delimited wire format, so the encoding is identical.
                Transaction: {
                    fields: {
                        rawData: { type: 'bytes', id: 1 },
                        signature: { rule: 'repeated', type: 'bytes', id: 2 },
                    },
                },
            },
        },
    },
};

const root = parseConfigure(TRON_CHAIN_SCHEMA);

const AnyType = root.lookupType('protocol.Any');
const TransferContractType = root.lookupType('protocol.TransferContract');
const TriggerSmartContractType = root.lookupType('protocol.TriggerSmartContract');
const TransactionRawType = root.lookupType('protocol.TransactionRaw');
const TransactionType = root.lookupType('protocol.Transaction');

const TRANSFER_CONTRACT_TYPE_URL = 'type.googleapis.com/protocol.TransferContract';
const TRIGGER_SMART_CONTRACT_TYPE_URL = 'type.googleapis.com/protocol.TriggerSmartContract';

const CONTRACT_TYPE_TRANSFER = 1; // ContractType.TransferContract
const CONTRACT_TYPE_TRIGGER_SMART_CONTRACT = 31; // ContractType.TriggerSmartContract

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
    const contractBytes = TransferContractType.encode(
        TransferContractType.fromObject({
            ownerAddress: Buffer.from(tronUtils.tronAddressToBytes(from)),
            toAddress: Buffer.from(tronUtils.tronAddressToBytes(to)),
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
    const contractBytes = TriggerSmartContractType.encode(
        TriggerSmartContractType.fromObject({
            ownerAddress: Buffer.from(tronUtils.tronAddressToBytes(from)),
            contractAddress: Buffer.from(tronUtils.tronAddressToBytes(contractAddress)),
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
