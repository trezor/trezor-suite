import { bytesToHex } from '@noble/hashes/utils.js';

import type { TronContracts } from '@trezor/connect-common';

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

const FREEZE_CONTRACT: TronContracts = {
    type: 'FreezeBalanceV2Contract',
    parameter: {
        value: {
            owner_address: OWNER_ADDRESS,
            balance: 1000000,
            resource: 1,
        },
    },
};

const FREEZE = {
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
    blockParams: {
        ref_block_bytes: 'e942',
        ref_block_hash: '6394747da9fee421',
        expiration: 1752562632000,
        timestamp: 1752562572000,
    },
} as const;

const UNFREEZE_CONTRACT: TronContracts = {
    type: 'UnfreezeBalanceV2Contract',
    parameter: {
        value: {
            owner_address: OWNER_ADDRESS,
            balance: 1000000,
            resource: 1,
        },
    },
};

const UNFREEZE = {
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
    blockParams: {
        ref_block_bytes: 'e942',
        ref_block_hash: '6394747da9fee421',
        expiration: 1752562632000,
        timestamp: 1752562572000,
    },
} as const;

const WITHDRAW_CONTRACT: TronContracts = {
    type: 'WithdrawExpireUnfreezeContract',
    parameter: {
        value: {
            owner_address: OWNER_ADDRESS,
        },
    },
};

const WITHDRAW = {
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
    blockParams: {
        ref_block_bytes: 'e942',
        ref_block_hash: '6394747da9fee421',
        expiration: 1752562632000,
        timestamp: 1752562572000,
    },
} as const;

const VOTE_CONTRACT: TronContracts = {
    type: 'VoteWitnessContract',
    parameter: {
        value: {
            owner_address: OWNER_ADDRESS,
            votes: [{ address: TO_ADDRESS, count: 5 }],
        },
    },
};

const VOTE = {
    signature:
        'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
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
        const { signature } = decoded;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignature: (typeof signature)[number] = signature[0];
        expect(bytesToHex(firstSignature)).toBe(TRX_TRANSFER.signature);
    });

    it('embeds rawData and signature for a freeze', () => {
        const rawDataHex = bytesToHex(
            encodeTronContractRawData(FREEZE_CONTRACT, FREEZE.blockParams),
        );
        const result = encodeBroadcastTransaction(rawDataHex, FREEZE.signature);

        const decoded = decodeBroadcastTransaction(result);
        expect(bytesToHex(decoded.rawData)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        const { signature } = decoded;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignature: (typeof signature)[number] = signature[0];
        expect(bytesToHex(firstSignature)).toBe(FREEZE.signature);
    });

    it('embeds rawData and signature for an unfreeze', () => {
        const rawDataHex = bytesToHex(
            encodeTronContractRawData(UNFREEZE_CONTRACT, UNFREEZE.blockParams),
        );
        const result = encodeBroadcastTransaction(rawDataHex, UNFREEZE.signature);

        const decoded = decodeBroadcastTransaction(result);
        expect(bytesToHex(decoded.rawData)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        const { signature } = decoded;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignature: (typeof signature)[number] = signature[0];
        expect(bytesToHex(firstSignature)).toBe(UNFREEZE.signature);
    });

    it('embeds rawData and signature for a withdraw', () => {
        const rawDataHex = bytesToHex(
            encodeTronContractRawData(WITHDRAW_CONTRACT, WITHDRAW.blockParams),
        );
        const result = encodeBroadcastTransaction(rawDataHex, WITHDRAW.signature);

        const decoded = decodeBroadcastTransaction(result);
        expect(bytesToHex(decoded.rawData)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        const { signature } = decoded;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignature: (typeof signature)[number] = signature[0];
        expect(bytesToHex(firstSignature)).toBe(WITHDRAW.signature);
    });

    it('embeds rawData and signature for a vote', () => {
        const rawDataHex = bytesToHex(encodeTronContractRawData(VOTE_CONTRACT, VOTE.blockParams));
        const result = encodeBroadcastTransaction(rawDataHex, VOTE.signature);

        const decoded = decodeBroadcastTransaction(result);
        expect(bytesToHex(decoded.rawData)).toBe(rawDataHex);
        expect(decoded.signature).toHaveLength(1);
        const { signature } = decoded;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignature: (typeof signature)[number] = signature[0];
        expect(bytesToHex(firstSignature)).toBe(VOTE.signature);
    });
});
