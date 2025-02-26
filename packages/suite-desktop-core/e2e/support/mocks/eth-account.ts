const ETH_ACC = {
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
    transactions: [
        {
            txid: '0xec38a68a61d7aebe95c0fdf122cef651a7084301e65ebc94d8ae40498bc84958',
            vin: [
                {
                    n: 0,
                    addresses: ['0x7de62F23453E9230cC038390901A9A0130105A3c'],
                    isAddress: true,
                    isOwn: true,
                },
            ],
            vout: [
                {
                    value: '100000000000000000',
                    n: 0,
                    addresses: ['0xAFA848357154a6a624686b348303EF9a13F63264'],
                    isAddress: true,
                },
            ],
            blockHash: '0x10d4e0b9db8cf40055154760238f7470ae3f3ccc6b8c6139b454464a2c768e54',
            blockHeight: 1469357,
            confirmations: 152124,
            blockTime: 1714736076,
            value: '100000000000000000',
            fees: '347242000000000',
            ethereumSpecific: {
                status: 1,
                nonce: 9,
                gasLimit: 416102,
                gasUsed: 173621,
                gasPrice: '2000000000',
                data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
                parsedData: {
                    methodId: '0x3a29dbae',
                    name: 'Stake',
                    function: 'stake(uint64)',
                    params: [
                        {
                            type: 'uint64',
                            values: ['1'],
                        },
                    ],
                },
                internalTransfers: [
                    {
                        type: 0,
                        from: '0x02a9d3637126923De9369557CD9673aae46666Fd',
                        to: '0x66cb3AeD024740164EBcF04e292dB09b5B63A2e1',
                        value: '55324575000000000',
                    },
                    {
                        type: 0,
                        from: '0xAFA848357154a6a624686b348303EF9a13F63264',
                        to: '0x66cb3AeD024740164EBcF04e292dB09b5B63A2e1',
                        value: '100000000000000000',
                    },
                ],
            },
        },
    ],
    stakingPools: [
        {
            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
            name: 'Everstake',
            pendingBalance: '1000000000000000000000',
            pendingDepositedBalance: '2000000000000000000000',
            depositedBalance: '3000000000000000000000',
            withdrawTotalAmount: '4000000000000000000000',
            claimableAmount: '5000000000000000000000',
            restakedReward: '1234000000000000000000',
            autocompoundBalance: '7000000000000000000000',
        },
    ],
    nonce: '1',
    tokens: [],
    addressAliases: {},
};

const isFirstAccount = (descriptor: string) => descriptor === ETH_ACC.address;

export const fixtures = [
    {
        method: 'getInfo',
        default: true,
        response: {
            id: '0',
            data: {
                name: 'Ethereum Archive',
                shortcut: 'ETH',
                decimals: 18,
                version: '0.4.0',
                bestHeight: 19960825,
                bestHash: '0x8339e411cd2f62b9493e36c444f7bd11ec716ceaa94f491e9726233d22abc024',
                block0Hash: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
                network: 'ETH',
                testnet: false,
                backend: {
                    version: 'erigon/2.59.3/linux-amd64/go1.21.6',
                    consensus_version: 'Prysm/v5.0.2 (linux amd64)',
                },
            },
        },
    },
    {
        method: 'getAccountInfo',
        default: true,
        response: ({ params }: any) => {
            if (isFirstAccount(params.descriptor)) {
                return { data: ETH_ACC };
            }
        },
    },
    {
        method: 'estimateFee',
        default: true,
        response: {
            data: [
                {
                    feePerTx: '25293986739000',
                    feePerUnit: '1204475559',
                    feeLimit: '21000',
                },
            ],
        },
    },
];
