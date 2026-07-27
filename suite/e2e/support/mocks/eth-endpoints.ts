import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';

export const ETH_MOCKED_ACCOUNT = {
    page: 1,
    totalPages: 1,
    itemsOnPage: 25,
    address: '0xcb6139253d4fa49712C08BF0Cb4F6ea6c2007bF5',
    balance: '1234000000000000000000',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    nonTokenTxs: 1,
    internalTxs: 0,
    transactions: [ETH_BASE_TX],
    stakingPools: [
        {
            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
            name: 'Everstake',
            pendingBalance: '100000000000000000000',
            pendingDepositedBalance: '200000000000000000000',
            depositedBalance: '3000000000000000000000',
            withdrawTotalAmount: '0',
            claimableAmount: '0',
            restakedReward: '234000000000000000000',
            autocompoundBalance: '3234000000000000000000',
        },
    ],
    nonce: '1',
    tokens: [
        {
            type: 'ERC20',
            standard: 'ERC20',
            name: 'Tether USD',
            contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            symbol: 'USDT',
            decimals: 6,
            balance: '1000000000',
            transfers: 1,
        },
        {
            type: 'ERC20',
            standard: 'ERC20',
            name: 'USD Coin',
            contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            balance: '1000000000',
            transfers: 1,
        },
    ],
    addressAliases: {},
};

const isFirstAccount = (descriptor: string) => descriptor === ETH_MOCKED_ACCOUNT.address;

export const fixtures = [
    {
        method: 'getInfo',
        default: true,
        response: {
            id: '0',
            data: {
                name: 'Ethereum Archive',
                shortcut: 'ETH',
                network: 'ETH',
                decimals: 18,
                version: '0.5.0',
                bestHeight: 22881953,
                bestHash: '0xdfe8811c2f0939d7f2cab4f93918c8e216a6cb8c8251196abe3234a52cd83155',
                block0Hash: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
                testnet: false,
                backend: {
                    version: 'erigon/3.0.11/linux-amd64/go1.23.10',
                    consensus_version: 'Prysm/v6.0.4 (linux amd64)',
                },
            },
        },
    },
    {
        method: 'getAccountInfo',
        default: true,
        response: ({ params }: any) => {
            if (isFirstAccount(params.descriptor)) {
                return { data: ETH_MOCKED_ACCOUNT };
            }
        },
    },
    {
        method: 'estimateFee',
        default: true,
        response: ({ params }: any) => {
            // ERC-4626 vault calls: deposit === 0x6e553f65, withdraw === 0xb460af94
            const vaultCallSelectors = ['0x6e553f65', '0xb460af94'];
            if (vaultCallSelectors.some(selector => params?.specific?.data?.startsWith(selector))) {
                return {
                    data: [
                        {
                            feePerTx: '108402800310000',
                            feePerUnit: '1204475559',
                            feeLimit: '90000',
                        },
                    ],
                };
            }

            return {
                data: [
                    {
                        feePerTx: '25293986739000',
                        feePerUnit: '1204475559',
                        feeLimit: '21000',
                    },
                ],
            };
        },
    },
    {
        method: 'sendTransaction',
        default: true,
        response: {
            data: { result: '0x1b4e7dfff573a40ae04daafa67798ee5984345a2bde5e5387d77493a6029690c' },
        },
    },
    {
        method: 'rpcCall',
        default: true,
        response: {
            data: {
                // ABI-encoded uint256(0) — allowance = 0
                data: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
        },
    },
    {
        method: 'subscribeAddresses',
        default: true,
        response: {
            subscribed: true,
        },
    },
    {
        method: 'getBalanceHistory',
        default: true,
        response: [],
    },
    {
        method: 'getCurrentFiatRates',
        default: true,
        response: {
            data: {
                ts: 1752167345,
                rates: {
                    usd: 1,
                },
            },
        },
    },
    {
        method: 'getFiatRatesForTimestamps',
        default: true,
        response: ({ params }: any) => {
            if (params.token && params.timestamps.length > 0) {
                return {
                    data: {
                        tickers: params.timestamps.map((ts: number) => ({
                            ts,
                            rates: {
                                usd: 0.5,
                            },
                        })),
                    },
                };
            }

            if (params.timestamps.length > 0) {
                return {
                    data: {
                        tickers: params.timestamps.map((ts: number) => ({
                            ts,
                            rates: {
                                usd: 2000,
                            },
                        })),
                    },
                };
            }
        },
    },
];
