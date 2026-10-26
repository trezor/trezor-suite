import type {
    BlockbookAccountInfo,
    BlockbookTransaction,
    TronAccountExtraData,
    TronStakingInfo,
} from '@trezor/blockchain-link-types';

export const TRON_MOCKED_ADDRESS = 'TWcuc2Mg9Hu3iLTfhCF1AMZdfyDVrEKg9k';
export const TRON_BEST_HEIGHT = 80_000_000;
export const TRON_BEST_HASH = `${TRON_BEST_HEIGHT.toString(16).padStart(16, '0')}${'a'.repeat(48)}`;

const TRON_SENDER_ADDRESS = 'TXxyoHWR2HRWNsGp51sLTEMZYnAqW3AWfy';

export const TRON_EMPTY_STAKING_INFO: TronStakingInfo = {
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

export const mockTronResources = (
    resources: Partial<TronAccountExtraData> = {},
): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 600,
    totalFreeBandwidth: 600,
    availableEnergy: 0,
    totalEnergy: 0,
    totalEnergyLimit: 180_000_000_000,
    totalEnergyWeight: 19_000_000_000,
    totalBandwidthLimit: 43_200_000_000,
    totalBandwidthWeight: 26_000_000_000,
    stakingInfo: TRON_EMPTY_STAKING_INFO,
    ...resources,
});

type MockTronTransactionParams = {
    txid: string;
    blockHeight: number;
    blockTime?: number;
    value?: string;
    from?: string;
    payload: NonNullable<BlockbookTransaction['chainExtraData']>['payload'];
};

export const mockTronTransaction = ({
    txid,
    blockHeight,
    blockTime = 1_760_000_000 + (blockHeight - TRON_BEST_HEIGHT) * 3,
    value = '0',
    from = TRON_MOCKED_ADDRESS,
    payload,
}: MockTronTransactionParams): BlockbookTransaction => ({
    txid,
    vin: [{ n: 0, addresses: [from], isAddress: true }],
    vout: [{ n: 0, value, addresses: [TRON_MOCKED_ADDRESS], isAddress: true }],
    blockHash: `${blockHeight.toString(16).padStart(16, '0')}${'b'.repeat(48)}`,
    blockHeight,
    confirmations: Math.max(TRON_BEST_HEIGHT - blockHeight + 1, 1),
    blockTime,
    value,
    fees: '0',
    chainExtraData: { payloadType: 'tron', payload },
});

const TRON_FUNDING_TX = mockTronTransaction({
    txid: 'c'.repeat(64),
    blockHeight: TRON_BEST_HEIGHT - 1_000,
    value: '1000000000',
    from: TRON_SENDER_ADDRESS,
    payload: { contractType: 'TransferContract', totalFee: '0', result: 'SUCCESS' },
});

export const TRON_MOCKED_ACCOUNT: BlockbookAccountInfo = {
    page: 1,
    totalPages: 1,
    itemsOnPage: 25,
    address: TRON_MOCKED_ADDRESS,
    balance: '1000000000',
    totalReceived: '1000000000',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    transactions: [TRON_FUNDING_TX],
    chainExtraData: { payloadType: 'tron', payload: mockTronResources() },
};

export const mockTronEmptyAccount = (address: string): BlockbookAccountInfo => ({
    page: 1,
    totalPages: 1,
    itemsOnPage: 25,
    address,
    balance: '0',
    totalReceived: '0',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 0,
});

export const fixtures = [
    {
        method: 'getInfo',
        default: true,
        response: {
            data: {
                name: 'Tron',
                shortcut: 'TRX',
                network: 'TRX',
                decimals: 6,
                version: '0.5.0',
                bestHeight: TRON_BEST_HEIGHT,
                bestHash: TRON_BEST_HASH,
                block0Hash: `${'0'.repeat(16)}${'d'.repeat(48)}`,
                testnet: false,
                backend: { version: 'java-tron/4.8.0' },
            },
        },
    },
    {
        method: 'getAccountInfo',
        default: true,
        response: ({ params }: { params: { descriptor: string } }) => ({
            data:
                params.descriptor === TRON_MOCKED_ADDRESS
                    ? TRON_MOCKED_ACCOUNT
                    : mockTronEmptyAccount(params.descriptor),
        }),
    },
    {
        method: 'sendTransaction',
        default: true,
        response: { data: { result: 'e'.repeat(64) } },
    },
    {
        method: 'subscribeAddresses',
        default: true,
        response: { data: { subscribed: true } },
    },
    {
        method: 'getBalanceHistory',
        default: true,
        response: { data: [] },
    },
    {
        method: 'getCurrentFiatRates',
        default: true,
        response: { data: { ts: 1_760_000_000, rates: { usd: 0.3 } } },
    },
    {
        method: 'getFiatRatesForTimestamps',
        default: true,
        response: ({ params }: { params: { timestamps: number[] } }) => ({
            data: { tickers: params.timestamps.map(ts => ({ ts, rates: { usd: 0.3 } })) },
        }),
    },
];
