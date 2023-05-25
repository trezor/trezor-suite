const PREV_TX = {
    txid: 'efe11e0d8d562e73b7795c2a3b7e44c6b6390f2c42c3ae90bb1005009c27a3f3',
    version: 2,
    vin: [
        {
            txid: '5961c1187b435a42e144a1c609253bca80ac0c55caf576831b6459c77fb690f1',
            sequence: 4294967295,
            n: 0,
            addresses: ['ltc1gp6wfe96yxq855dhjjg0eg24yl8y6se62hgcadmh6jdyxfdlljy6slgmvea'],
            isAddress: false,
            value: '458340830086',
        },
    ],
    vout: [
        {
            value: '458330830086',
            n: 0,
            spent: true,
            hex: '582066723521c495f90a5fbe3686c617c294d69ac71ed9e57b65032f83e45871fd83',
            addresses: ['ltc1gveer2gwyjhus5ha7x6rvv97zjntf43c7m8jhkegr97p7gkr3lkpsj08e2q'],
            isAddress: false,
        },
        {
            value: '9997490',
            n: 1,
            hex: '0014f4de962f4bb82d0057974201202acd78d56db7f2',
            addresses: ['ltc1q7n0fvt6thqksq4uhggqjq2kd0r2kmdlje4dvjg'],
            isAddress: true,
        },
    ],
    blockHash: '98cdd21f13d92ccd23478681d6698aea20a7132d7ca9bec1204e0d25e9355eba',
    blockHeight: 2373435,
    confirmations: 29,
    blockTime: 1669107971,
    value: '458340827576',
    valueIn: '458340830086',
    fees: '2510',
    hex: '02000000000801f190b67fc759641b8376f5ca550cac80ca3b2509c6a144e1425a437b18c161590000000000ffffffff020675a5b66a00000022582066723521c495f90a5fbe3686c617c294d69ac71ed9e57b65032f83e45871fd83b28c980000000000160014f4de962f4bb82d0057974201202acd78d56db7f20000000000',
};

const LTC_ACCOUNT = {
    page: 1,
    totalPages: 1,
    itemsOnPage: 25,
    address:
        'Ltub2ZYSDNkHBYfdWFMg5CPq9KuqJrjB8QNCtyHXKzdEN4kx1Kp68XXhurqzjS1xuENMgSo8Skib8vDTmgxakHCJQQ9Tv4gsjyEkC1AdzD1jjaq',
    balance: '9997490',
    totalReceived: '9997490',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    transactions: [PREV_TX],
    usedTokens: 1,
    tokens: [
        {
            type: 'XPUBAddress',
            name: 'ltc1q7n0fvt6thqksq4uhggqjq2kd0r2kmdlje4dvjg',
            path: "m/84'/2'/0'/0/0",
            transfers: 1,
            decimals: 8,
            balance: '9997490',
            totalReceived: '9997490',
            totalSent: '0',
        },
        {
            type: 'XPUBAddress',
            name: 'ltc1qjwamf85d5ua429l256pugmkp89rhkezndh8t3t',
            path: "m/84'/2'/0'/1/0",
            transfers: 0,
            decimals: 8,
        },
        {
            type: 'XPUBAddress',
            name: 'ltc1q6fwte9tar4dftxuarz8lwyfnwdmmt9azxjatpl',
            path: "m/84'/2'/0'/1/1",
            transfers: 0,
            decimals: 8,
        },
    ],
};

const isFirstAccount = (descriptor: string) => descriptor === LTC_ACCOUNT.address;

export const fixtures = [
    {
        method: 'getInfo',
        default: true,
        response: {
            data: {
                name: 'LitecoinMock',
                shortcut: 'LTC',
                decimals: 8,
                version: '0.3.6',
                bestHeight: 2373436,
                bestHash: '2c1bc2b99f8a4447a57dfc7b694b9c82bff1b3af7cce8ff151df01238dc07c8b',
                block0Hash: '12a765e31ffd4059bada1e25190f6e98c99d9714d334efa41a195a7e7e04bfe2',
                testnet: false,
                backend: { version: '210201', subversion: '/LitecoinCore:0.21.2.1/' },
            },
        },
    },
    {
        method: 'getAccountInfo',
        default: true,
        response: ({ params }: any) => {
            if (isFirstAccount(params.descriptor)) {
                return { data: LTC_ACCOUNT };
            }
        },
    },
    {
        method: 'getAccountUtxo',
        default: true,
        response: {
            data: [
                {
                    txid: PREV_TX.txid,
                    vout: 1,
                    value: '9997490',
                    height: 2373435,
                    confirmations: 2,
                    address: 'ltc1q7n0fvt6thqksq4uhggqjq2kd0r2kmdlje4dvjg',
                    path: "m/84'/2'/0'/0/0",
                },
            ],
        },
    },
    {
        method: 'estimateFee',
        default: true,
        response: {
            data: [
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
                { feePerUnit: '999' },
            ],
        },
    },
    {
        method: 'getTransaction',
        default: true,
        response: ({ params }: any) => {
            if (params?.txid === PREV_TX.txid) {
                return {
                    data: PREV_TX,
                };
            }
        },
    },
];
