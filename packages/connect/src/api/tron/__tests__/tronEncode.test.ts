import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import {
    estimateTronTransferBandwidth,
    estimateTronTrc20Bandwidth,
} from '../estimateTronBandwidth';
import { encodeBroadcastTransaction, encodeTransferRawData } from '../tronEncode';
import { TransactionType } from '../tronProtobuf';

const OWNER_ADDRESS = '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58';
const TO_ADDRESS = '4141f82674a30ae1328745d08afe2d1a0a24195283';

const TRX_TRANSFER = {
    from: OWNER_ADDRESS,
    to: TO_ADDRESS,
    amount: '18123456',
    refBlockBytes: 'e942',
    refBlockHash: '6394747da9fee421',
    expiration: 1752562632000,
    timestamp: 1752562572000,
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
};

const TRC20_TRIGGER = {
    data: 'a9059cbb000000000000000000000000d093f24888ab06073a4bdffbb8107db1ea9dc0a000000000000000000000000000000000000000000000000000000000013bb450',
};

describe('tron/estimateTronTransferBandwidth', () => {
    it('returns the expected bandwidth for a TRX transfer', () => {
        expect(estimateTronTransferBandwidth(TRX_TRANSFER.amount)).toBe(268);
    });
});

describe('tron/estimateTronTrc20Bandwidth', () => {
    it('returns the expected bandwidth for a TRC-20 trigger', () => {
        expect(estimateTronTrc20Bandwidth(TRC20_TRIGGER.data)).toBe(345);
    });
});

describe('tron/encodeBroadcastTransaction', () => {
    it('embeds rawData and signature for a TRX transfer', () => {
        const rawDataHex = bytesToHex(encodeTransferRawData(TRX_TRANSFER));
        const result = encodeBroadcastTransaction(rawDataHex, TRX_TRANSFER.signature);

        const decoded = TransactionType.toObject(TransactionType.decode(hexToBytes(result)));
        expect(bytesToHex(decoded.rawData as Uint8Array)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        expect(bytesToHex(decoded.signature[0] as Uint8Array)).toBe(TRX_TRANSFER.signature);
    });
});
