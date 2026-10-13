import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import type { TronAccountExtraData, TronStakingInfo } from '@trezor/blockchain-link-types';

// First Tron account (m/44'/195'/0'/0/0) of the staking test mnemonic
// "access juice claim special truth ugly swarm rabbit hair man error bar".
export const TRX_FIRST_ACCOUNT_ADDRESS = 'TWcuc2Mg9Hu3iLTfhCF1AMZdfyDVrEKg9k';

const isFirstAccount = (descriptor: string) => descriptor === TRX_FIRST_ACCOUNT_ADDRESS;

// A Tron txid is sha256 of the transaction's raw_data, the first length-delimited field of the
// broadcast `Transaction { bytes raw_data = 1; repeated bytes signature = 2; }` protobuf.
export const deriveTrxTxid = (serializedTxHex: string) => {
    const bytes = hexToBytes(serializedTxHex);
    if (bytes[0] !== 0x0a) {
        throw new Error('Serialized Tron transaction does not start with the raw_data field');
    }

    // The field length is a varint: 7 bits per byte, little-endian, high bit set on all but the last.
    let offset = 1;
    let length = 0;
    let byte: number;
    do {
        byte = bytes[offset] ?? 0;
        length |= (byte & 0x7f) << (7 * (offset - 1));
        offset += 1;
    } while (byte & 0x80);

    return bytesToHex(sha256(bytes.subarray(offset, offset + length)));
};

export const TRX_BEST_BLOCK = {
    height: 75_000_000,
    hash: '0000000004787c40b1b1a8b4a4f0b3b3d7c9e7a2a1b0c9d8e7f6a5b4c3d2e1f0',
};

// Network-wide resource weights: 1 TRX frozen gives 2.16 bandwidth or 18 energy.
export const TRX_RESOURCE_LIMITS = {
    totalEnergyLimit: 180_000_000_000,
    totalEnergyWeight: 10_000_000_000,
    totalBandwidthLimit: 43_200_000_000,
    totalBandwidthWeight: 20_000_000_000,
};

export const TRX_EMPTY_STAKING_INFO: TronStakingInfo = {
    stakedBalance: '0',
    stakedBalanceEnergy: '0',
    stakedBalanceBandwidth: '0',
    unstakingBatches: [],
    totalVotingPower: '0',
    availableVotingPower: '0',
    votes: [],
    unclaimedReward: '0',
    latestWithdrawTime: 0,
    delegatedBalanceEnergy: '0',
    delegatedBalanceBandwidth: '0',
};

export const TRX_MOCKED_RESOURCES: TronAccountExtraData = {
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 600,
    totalFreeBandwidth: 600,
    availableEnergy: 0,
    totalEnergy: 0,
    ...TRX_RESOURCE_LIMITS,
    stakingInfo: TRX_EMPTY_STAKING_INFO,
};

export const TRX_FUNDING_TX = {
    txid: 'db419f4b5f9e5e29a8799f6a65643cde24218ccc6864552027d18ef44ee3f054',
    vin: [{ n: 0, addresses: ['TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7'], isAddress: true }],
    vout: [
        {
            n: 0,
            value: '1000000000',
            addresses: [TRX_FIRST_ACCOUNT_ADDRESS],
            isAddress: true,
            isOwn: true,
        },
    ],
    blockHash: '00000000047867ff1c3c2b7a8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f80910',
    blockHeight: TRX_BEST_BLOCK.height - 1_000,
    confirmations: 1_020,
    blockTime: 1_752_165_560,
    value: '1000000000',
    fees: '0',
    chainExtraData: {
        payloadType: 'tron',
        payload: { contractType: 'TransferContract', operation: 'transfer' },
    },
};

export const TRX_MOCKED_ACCOUNT = {
    page: 1,
    totalPages: 1,
    itemsOnPage: 25,
    address: TRX_FIRST_ACCOUNT_ADDRESS,
    balance: '1000000000',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    nonTokenTxs: 1,
    transactions: [TRX_FUNDING_TX],
    tokens: [],
    chainExtraData: { payloadType: 'tron', payload: TRX_MOCKED_RESOURCES },
};

type TronTxPayload = {
    contractType: string;
    operation: string;
    resource?: string;
    stakeAmount?: string;
    votes?: { address: string; count: string }[];
};

type BuildTrxStakingTxParams = {
    txid: string;
    address: string;
    payload: TronTxPayload;
    blockHeight: number;
};

// A confirmed, self-addressed Tron staking transaction in the Blockbook format.
export const buildTrxStakingTx = ({
    txid,
    address,
    payload,
    blockHeight,
}: BuildTrxStakingTxParams) => ({
    txid,
    vin: [{ n: 0, addresses: [address], isAddress: true, isOwn: true }],
    vout: [{ n: 0, value: '0', addresses: [address], isAddress: true, isOwn: true }],
    blockHash: TRX_BEST_BLOCK.hash,
    blockHeight,
    confirmations: 20,
    blockTime: 1_752_168_560,
    value: '0',
    fees: '0',
    chainExtraData: { payloadType: 'tron', payload },
});

export const fixtures = [
    {
        method: 'getInfo',
        default: true,
        response: {
            id: '0',
            data: {
                name: 'Tron',
                shortcut: 'TRX',
                network: 'TRX',
                decimals: 6,
                version: '0.5.0',
                bestHeight: TRX_BEST_BLOCK.height,
                bestHash: TRX_BEST_BLOCK.hash,
                block0Hash: '0000000000000000de1aa6a5ca38a0b0e9b3f3e2d3a1c8f9e0b7c6d5a4b3c2d1',
                testnet: false,
                backend: { version: 'java-tron/4.7.5' },
            },
        },
    },
    {
        method: 'getAccountInfo',
        default: true,
        response: ({ params }: any) => {
            if (isFirstAccount(params.descriptor)) {
                return { data: TRX_MOCKED_ACCOUNT };
            }
        },
    },
    {
        method: 'estimateFee',
        default: true,
        response: { data: [{ feePerTx: '1000', feePerUnit: '1000' }] },
    },
    {
        method: 'sendTransaction',
        default: true,
        response: ({ params }: any) => ({ data: { result: deriveTrxTxid(params.hex) } }),
    },
    {
        method: 'subscribeAddresses',
        default: true,
        response: { subscribed: true },
    },
    {
        method: 'getBalanceHistory',
        default: true,
        response: [],
    },
    {
        method: 'getCurrentFiatRates',
        default: true,
        response: { data: { ts: 1752167345, rates: { usd: 1 } } },
    },
    {
        method: 'getFiatRatesForTimestamps',
        default: true,
        response: ({ params }: any) => {
            if (params.timestamps.length > 0) {
                return {
                    data: {
                        tickers: params.timestamps.map((ts: number) => ({ ts, rates: { usd: 1 } })),
                    },
                };
            }
        },
    },
];
