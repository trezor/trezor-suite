import { bytesToHex } from '@noble/hashes/utils.js';

import { loadProtobufModules } from '../../../data/protobufLoader';
import { encodeTronContractRawData } from '../tronEncode';
import { decodeBroadcastTransaction, encodeBroadcastTransaction } from '../tronProtobuf';

const OWNER_ADDRESS = '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58';
const TO_ADDRESS = '4141f82674a30ae1328745d08afe2d1a0a24195283';

const TRX_TRANSFER = {
    amount: '18123456',
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
    contract: {
        type: 'TransferContract',
        parameter: {
            value: {
                owner_address: OWNER_ADDRESS,
                to_address: TO_ADDRESS,
                amount: 18123456,
            },
        },
    },
    blockParams: {
        ref_block_bytes: 'e942',
        ref_block_hash: '6394747da9fee421',
        expiration: 1752562632000,
        timestamp: 1752562572000,
    },
} as const;

beforeAll(async () => {
    await loadProtobufModules();
});

describe('tron/encodeBroadcastTransaction', () => {
    it('embeds rawData and signature for a TRX transfer', () => {
        const rawDataHex = bytesToHex(
            encodeTronContractRawData(TRX_TRANSFER.contract, TRX_TRANSFER.blockParams),
        );
        const result = encodeBroadcastTransaction(rawDataHex, TRX_TRANSFER.signature);

        const decoded = decodeBroadcastTransaction(result);
        expect(bytesToHex(decoded.rawData)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        expect(bytesToHex(decoded.signature[0])).toBe(TRX_TRANSFER.signature);
    });
});
