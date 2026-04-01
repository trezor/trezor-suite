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

export const AnyType = root.lookupType('protocol.Any');
export const TransferContractType = root.lookupType('protocol.TransferContract');
export const TriggerSmartContractType = root.lookupType('protocol.TriggerSmartContract');
export const TransactionRawType = root.lookupType('protocol.TransactionRaw');
export const TransactionType = root.lookupType('protocol.Transaction');

export const TRANSFER_CONTRACT_TYPE_URL = 'type.googleapis.com/protocol.TransferContract';
export const TRIGGER_SMART_CONTRACT_TYPE_URL = 'type.googleapis.com/protocol.TriggerSmartContract';

export const CONTRACT_TYPE_TRANSFER = 1; // ContractType.TransferContract
export const CONTRACT_TYPE_TRIGGER_SMART_CONTRACT = 31; // ContractType.TriggerSmartContract
