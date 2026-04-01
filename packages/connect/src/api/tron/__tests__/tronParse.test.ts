import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { tronUtils } from '@trezor/blockchain-link-utils';

import { encodeTransferRawData, encodeTriggerSmartContractRawData } from '../tronEncode';
import { parseTronTransaction } from '../tronParse';
import { AnyType, TransactionRawType } from '../tronProtobuf';

const OWNER_ADDRESS = tronUtils.tronBytesToAddress(
    hexToBytes('41f2cd810c48c401d392ead3c6e1e1cb9f57750a58'),
)!;
const TO_ADDRESS = tronUtils.tronBytesToAddress(
    hexToBytes('4141f82674a30ae1328745d08afe2d1a0a24195283'),
)!;
const CONTRACT_ADDRESS = tronUtils.tronBytesToAddress(
    hexToBytes('4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0'),
)!;

const TRX_TRANSFER = {
    from: OWNER_ADDRESS,
    to: TO_ADDRESS,
    amount: '18123456',
    refBlockBytes: 'e942',
    refBlockHash: '6394747da9fee421',
    expiration: 1752562632000,
    timestamp: 1752562572000,
};

const TRC20_TRIGGER = {
    from: OWNER_ADDRESS,
    contractAddress: CONTRACT_ADDRESS,
    data: 'a9059cbb000000000000000000000000d093f24888ab06073a4bdffbb8107db1ea9dc0a000000000000000000000000000000000000000000000000000000000013bb450',
    feeLimit: 50_000_000,
    refBlockBytes: 'dae0',
    refBlockHash: '9ab5c70b3a11405f',
    expiration: 1766454906000,
    timestamp: 1766453046721,
};

describe('tron/parseTronTransaction', () => {
    it('round-trips a TRX transfer', () => {
        const rawDataHex = bytesToHex(encodeTransferRawData(TRX_TRANSFER));

        expect(parseTronTransaction(rawDataHex)).toStrictEqual({
            ref_block_bytes: 'e942',
            ref_block_hash: '6394747da9fee421',
            expiration: 1752562632000,
            timestamp: 1752562572000,
            fee_limit: undefined,
            contract: [
                {
                    type: 'TransferContract',
                    parameter: {
                        value: {
                            owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                            to_address: '4141f82674a30ae1328745d08afe2d1a0a24195283',
                            amount: '18123456',
                        },
                    },
                },
            ],
        });
    });

    it('round-trips a TRC-20 transfer', () => {
        const rawDataHex = bytesToHex(encodeTriggerSmartContractRawData(TRC20_TRIGGER));

        expect(parseTronTransaction(rawDataHex)).toStrictEqual({
            ref_block_bytes: 'dae0',
            ref_block_hash: '9ab5c70b3a11405f',
            expiration: 1766454906000,
            timestamp: 1766453046721,
            fee_limit: 50_000_000,
            contract: [
                {
                    type: 'TriggerSmartContract',
                    parameter: {
                        value: {
                            owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                            contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
                            data: TRC20_TRIGGER.data,
                        },
                    },
                },
            ],
        });
    });

    it('throws on unsupported contract type', () => {
        const rawDataHex = bytesToHex(
            TransactionRawType.encode(
                TransactionRawType.fromObject({
                    refBlockBytes: Buffer.from(hexToBytes('e942')),
                    refBlockHash: Buffer.from(hexToBytes('6394747da9fee421')),
                    expiration: 1752562632000,
                    timestamp: 1752562572000,
                    contract: [
                        {
                            type: 999,
                            parameter: AnyType.fromObject({
                                typeUrl: 'type.googleapis.com/protocol.Unknown',
                                value: Buffer.from([]),
                            }),
                        },
                    ],
                }),
            ).finish(),
        );

        expect(() => parseTronTransaction(rawDataHex)).toThrow(
            'Unsupported Tron contract type: 999',
        );
    });
});
