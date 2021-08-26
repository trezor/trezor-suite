import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';

export const BTC_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'btc',
        networkType: 'bitcoin',
        descriptor: 'xpub',
        deviceState: 'deviceState',
        key: 'xpub-btc-deviceState',
        addresses: {
            change: [
                { path: "m/44'/0'/0'/1/0", address: '1-change' },
                { path: "m/44'/0'/0'/1/1", address: '2-change' },
            ],
            used: [
                { path: "m/44'/0'/0'/0/0", address: '1-used' },
                { path: "m/44'/0'/0'/0/1", address: '2-used' },
            ],
            unused: [
                { path: "m/44'/0'/0'/0/2", address: '1-unused' },
                { path: "m/44'/0'/0'/0/3", address: '2-unused' },
            ],
        },
        balance: '100000000000',
        availableBalance: '100000000000',
        formattedBalance: '1000 BTC',
        utxo: [
            { amount: '0', txid: 'should-never-be-used' },
            { amount: '50000000000', txid: 'utxoA' },
            { amount: '25000000000', txid: 'utxoB' },
            { amount: '12500000000', txid: 'utxoC' },
            { amount: '6250000000', txid: 'utxoD' },
            { amount: '6250000000', txid: 'utxoE' },
        ],
        history: {},
    },
    network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8, features: ['rbf'] },
};

export const ETH_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'eth',
        networkType: 'ethereum',
        descriptor: '0xdB09b793984B862C430b64B9ed53AcF867cC041F',
        deviceState: 'deviceState',
        key: '0xdB09b793984B862C430b64B9ed53AcF867cC041F-eth-deviceState',
        balance: '10000000000000000000', // 10 ETH
        availableBalance: '10000000000000000000', // 10 ETH
        misc: { nonce: '0' },
        history: {},
        tokens: [{ type: 'ERC20', address: '0xABCD', symbol: '0xABCD', decimals: 3, balance: '1' }],
    },
    network: { networkType: 'ethereum', symbol: 'eth', decimals: 18, chainId: 1 },
};

export const XRP_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'xrp',
        networkType: 'ripple',
        descriptor: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY',
        deviceState: 'deviceState',
        key: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY-xrp-deviceState',
        balance: '100000000', // 100 XRP
        availableBalance: '100000000', // 100 XRP
        misc: { reserve: '21' },
        history: {},
    },
    network: { networkType: 'ripple', symbol: 'xrp', decimals: 6 },
};

export const DEFAULT_STORE = {
    suite: {
        device: global.JestMocks.getSuiteDevice({
            state: 'deviceState',
            connected: true,
            available: true,
        }),
        settings: { debug: {}, theme: { variant: 'light' } },
        online: true,
        locks: [],
    },
    wallet: {
        accounts: [BTC_ACCOUNT.account, ETH_ACCOUNT.account, XRP_ACCOUNT.account],
        selectedAccount: BTC_ACCOUNT,
        settings: {
            localCurrency: 'usd',
            lastUsedFeeLevel: {},
            debug: {},
        },
        fees: {
            btc: {
                minFee: 1,
                maxFee: 100,
                blockHeight: 1,
                blockTime: 1,
                levels: [{ label: 'normal', feePerUnit: '4', blocks: 1 }],
            },
            eth: {
                minFee: 1,
                maxFee: 100,
                blockHeight: 1,
                blockTime: 1,
                levels: [
                    { label: 'normal', feePerUnit: '3300000000', feeLimit: '21000', blocks: -1 },
                ],
            },
            xrp: {
                minFee: 1,
                maxFee: 100,
                blockHeight: 1,
                blockTime: 1,
                levels: [{ label: 'normal', feePerUnit: '12', blocks: -1 }],
            },
        },
        fiat: {
            coins: [
                {
                    symbol: 'btc',
                    current: {
                        symbol: 'btc',
                        ts: 0,
                        rates: { usd: 1, eur: 1.2, czk: 22 },
                    },
                },
                {
                    symbol: 'eth',
                    current: {
                        symbol: 'eth',
                        ts: 0,
                        rates: { usd: 1, eur: 1.2, czk: 22 },
                    },
                },
                {
                    symbol: 'xrp',
                    current: {
                        symbol: 'xrp',
                        ts: 0,
                        rates: { usd: 1, eur: 1.2, czk: 22 },
                    },
                },
            ],
        },
        transactions: {
            transactions: {},
        },
    },
    devices: [], // to remove?
    protocol: { sendForm: {} },
};

const DEFAULT_DRAFT = {
    ...DEFAULT_VALUES,
    outputs: [{ ...DEFAULT_PAYMENT }],
    options: [...DEFAULT_VALUES.options],
};

const getDraft = (draft?: any) => ({
    'xpub-btc-deviceState': {
        ...DEFAULT_DRAFT,
        outputs: [
            {
                ...DEFAULT_PAYMENT,
                address: 'A',
                amount: '1',
            },
        ],
        ...draft,
    },
    '0xdB09b793984B862C430b64B9ed53AcF867cC041F-eth-deviceState': {
        ...DEFAULT_DRAFT,
        outputs: [
            {
                ...DEFAULT_PAYMENT,
                address: '0xdB09b793984B862C430b64B9ed53AcF867cC041F',
                amount: '1',
            },
        ],
        ...draft,
    },
    'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY-xrp-deviceState': {
        ...DEFAULT_DRAFT,
        outputs: [
            {
                ...DEFAULT_PAYMENT,
                address: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY',
                amount: '1',
            },
        ],
        ...draft,
    },
});

export const addingOutputs = [
    // {
    //     description: 'Add/Remove opreturn',
    //     initial: {
    //         outputs: [{ address: '' }],
    //     },
    //     actions: [
    //         {
    //             type: 'click',
    //             element: '@send/header-dropdown',
    //         },
    //         {
    //             type: 'click',
    //             element: '@send/header-dropdown',
    //         },
    //         {
    //             type: 'click',
    //             element: '@send/header-dropdown/opreturn',
    //             result: {
    //                 formValues: {
    //                     outputs: [{ type: 'opreturn' }],
    //                 },
    //             },
    //         },
    //     ],
    // },
    {
        description: 'Add/Remove/Reset outputs without draft',
        initial: {
            outputs: [{ address: '' }],
        },
        actions: [
            {
                type: 'click',
                element: 'add-output',
                result: {
                    formValues: {
                        outputs: [{ address: '' }, { address: '' }],
                    },
                },
            },
            {
                type: 'click',
                element: 'outputs[0].remove',
                result: {
                    formValues: {
                        outputs: [{ address: '' }],
                    },
                },
            },
            {
                type: 'click',
                element: 'clear-form',
                result: {
                    formValues: {
                        outputs: [{ address: '' }],
                    },
                },
            },
        ],
    },
    {
        description: 'Add/Remove/Reset outputs with draft and set-max in second output',
        store: {
            send: {
                drafts: {
                    'xpub-btc-deviceState': {
                        ...DEFAULT_DRAFT,
                        outputs: [
                            {
                                ...DEFAULT_PAYMENT,
                                address: 'A',
                                amount: '1',
                            },
                            {
                                ...DEFAULT_PAYMENT,
                                address: 'B',
                                amount: '2',
                            },
                        ],
                        setMaxOutputId: 1,
                    },
                },
            },
        },
        initial: {
            outputs: [{ address: 'A' }, { address: 'B' }],
        },
        actions: [
            {
                type: 'click',
                element: 'add-output',
                result: {
                    formValues: {
                        outputs: [{ address: 'A' }, { address: 'B' }, { address: '' }],
                        setMaxOutputId: 1,
                    },
                },
            },
            {
                type: 'click',
                element: 'outputs[0].remove',
                result: {
                    formValues: {
                        outputs: [{ address: 'B' }, { address: '' }],
                        setMaxOutputId: 0,
                    },
                },
            },
            {
                type: 'click',
                element: 'clear-form',
                result: {
                    formValues: {
                        outputs: [{ address: '' }],
                        setMaxOutputId: undefined,
                    },
                },
            },
        ],
    },
    {
        description: 'Add/Remove/Reset outputs with draft and set-max in first output',
        store: {
            send: {
                drafts: {
                    'xpub-btc-deviceState': {
                        ...DEFAULT_DRAFT,
                        outputs: [
                            {
                                ...DEFAULT_PAYMENT,
                                address: 'A',
                                amount: '1',
                            },
                            {
                                ...DEFAULT_PAYMENT,
                                address: 'B',
                                amount: '2',
                            },
                        ],
                        setMaxOutputId: 0,
                    },
                },
            },
        },
        initial: {
            outputs: [{ address: 'A' }, { address: 'B' }],
        },
        actions: [
            {
                type: 'click',
                element: 'add-output',
                result: {
                    formValues: {
                        outputs: [{ address: 'A' }, { address: 'B' }, { address: '' }],
                        setMaxOutputId: 0,
                    },
                },
            },
            {
                type: 'click',
                element: 'outputs[0].remove',
                result: {
                    formValues: {
                        outputs: [{ address: 'B' }, { address: '' }],
                        setMaxOutputId: undefined,
                    },
                },
            },
            {
                type: 'click',
                element: 'clear-form',
                result: {
                    formValues: {
                        outputs: [{ address: '' }],
                        setMaxOutputId: undefined,
                    },
                },
            },
        ],
    },
];

export const drafts = [
    {
        description: 'Load draft and compose without errors',
        connect: {
            success: true,
            payload: [],
        },
    },
    {
        description: 'Load draft and compose with errors',
    },
];

export const composeDebouncedTransaction = [
    {
        description: 'compose with validation errors (Address not set)',
        actions: [
            {
                type: 'input',
                element: 'outputs[0].address',
                value: 'X',
                result: {
                    errors: {
                        outputs: [{ address: { message: 'RECIPIENT_IS_NOT_VALID' } }],
                    },
                },
            },
            {
                type: 'input',
                element: 'outputs[0].address',
                result: {
                    errors: {
                        outputs: [{ address: { message: 'RECIPIENT_IS_NOT_SET' } }],
                    },
                },
            },
        ],
        finalResult: {
            composeTransactionCalls: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ address: { message: 'RECIPIENT_IS_NOT_SET' } }],
            },
        },
    },
    {
        description: 'compose with validation errors (Address invalid)',
        actions: [{ type: 'input', element: 'outputs[0].address', value: 'FOO', delay: 1 }],
        finalResult: {
            composeTransactionCalls: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ address: { message: 'RECIPIENT_IS_NOT_VALID' } }],
            },
        },
    },
    {
        description: 'compose with validation errors (Amount not a number)',
        actions: [{ type: 'input', element: 'outputs[0].amount', value: '11a', delay: 1 }],
        finalResult: {
            composeTransactionCalls: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ amount: { message: 'AMOUNT_IS_NOT_NUMBER' } }],
            },
        },
    },
    {
        description: 'trezor-connect call respond with success:false',
        connect: {
            success: false,
            payload: { error: 'error' },
        },
        actions: [{ type: 'input', element: 'outputs[0].amount', value: '1' }],
        finalResult: {
            composeTransactionCalls: 1,
            composedLevels: undefined,
        },
    },
    {
        description: 'Fast typing, one trezor-connect call',
        connect: {
            success: true,
            payload: [
                {
                    type: 'nonfinal',
                },
            ],
        },
        actions: [{ type: 'input', element: 'outputs[0].amount', value: '111', delay: 100 }],
        finalResult: {
            composeTransactionCalls: 1,
            composedLevels: {
                normal: {
                    type: 'nonfinal',
                },
            },
        },
    },
    {
        description: 'Slow typing, multiple trezor-connect calls, only last call gets processed',
        connect: [
            {
                success: true,
                payload: [{ type: 'nonfinal', totalSpent: '100000000' }],
            },
            {
                // delay in trezor-connect response greater than typing delay
                // basically it means: return this response AFTER third call to connect, this response should be ignored
                delay: 500,
                success: true,
                payload: [{ type: 'nonfinal', totalSpent: '1100000000' }],
            },
            {
                success: true,
                payload: [{ type: 'nonfinal', totalSpent: '11100000000' }],
            }, // delay in trezor-connect response, greater than typing delay
        ],
        actions: [{ type: 'input', element: 'outputs[0].amount', value: '111', delay: 310 }], // delay greater than composeDebounced timeout
        finalResult: {
            composeTransactionCalls: 3,
            composedLevels: {
                normal: {
                    type: 'nonfinal',
                    totalSpent: '11100000000',
                },
            },
        },
    },
];

export const setMax = [
    {
        description:
            'setMax: compose from draft (one input), Amount not affected, but Fiat gets recalculated',
        store: {
            send: {
                drafts: {
                    'xpub-btc-deviceState': {
                        ...DEFAULT_DRAFT,
                        outputs: [
                            {
                                ...DEFAULT_PAYMENT,
                                address: '',
                                amount: '1',
                                fiat: '2.00',
                            },
                        ],
                        setMaxOutputId: 0,
                    },
                },
            },
        },
        connect: {
            success: true,
            payload: [
                {
                    type: 'nonfinal',
                    max: '100000000',
                },
            ],
        },
        finalResult: {
            composeTransactionCalls: 1,
            composedLevels: {
                normal: {
                    type: 'nonfinal',
                },
            },
            formValues: {
                selectedFee: undefined,
                outputs: [{ address: '', amount: '1', fiat: '1.00' }],
            },
        },
    },
    {
        description:
            'setMax: compose from draft with error on default level, switching to custom level',
        store: {
            send: {
                drafts: {
                    'xpub-btc-deviceState': {
                        ...DEFAULT_DRAFT,
                        outputs: [
                            {
                                ...DEFAULT_PAYMENT,
                                address: 'A',
                                amount: '1',
                                fiat: '2.00',
                            },
                        ],
                        setMaxOutputId: 0,
                    },
                },
            },
        },
        connect: [
            {
                success: true,
                payload: [
                    {
                        type: 'error',
                    },
                ],
            },
            {
                success: true,
                payload: [
                    { type: 'error' },
                    { type: 'final', feePerByte: '2', max: '10000000' },
                    { type: 'final', feePerByte: '1', max: '10000001' },
                ],
            },
        ],
        finalResult: {
            composeTransactionCalls: 2,
            composedLevels: { normal: { type: 'error' }, custom: { type: 'final' } },
            formValues: {
                selectedFee: 'custom' as const,
                feePerUnit: '2',
                outputs: [{ amount: '0.1', fiat: '0.10' }],
            },
        },
    },
    {
        description: 'setMax sequence: compose not final (without address) then add address',
        connect: [
            {
                success: true,
                payload: [
                    {
                        type: 'nonfinal',
                        max: '100000000',
                    },
                ],
            },
            {
                success: true,
                payload: [
                    {
                        type: 'final',
                        max: '100000000',
                    },
                ],
            },
        ],
        actions: [
            {
                type: 'hover',
                element: 'outputs[0].amount',
            },
            {
                type: 'click',
                element: 'outputs[0].setMax',
                result: {
                    composeTransactionCalls: 1,
                    composeTransactionParams: {
                        outputs: [{ type: 'send-max-noaddress' }],
                    },
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [{ address: '', amount: '1', fiat: '1.00' }],
                    },
                    composedLevels: {
                        normal: { type: 'nonfinal' },
                    },
                },
            },
            {
                type: 'input',
                element: 'outputs[0].address',
                value: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                result: {
                    composeTransactionParams: {
                        outputs: [
                            { type: 'send-max', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX' },
                        ],
                    },
                },
            },
        ],
        finalResult: {
            composeTransactionCalls: 2,
            formValues: {
                setMaxOutputId: 0,
                outputs: [
                    { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' },
                ],
            },
            composedLevels: {
                normal: { type: 'final' },
            },
        },
    },
    {
        description:
            'setMax sequence: compose final with address, disable setMax, add second output',
        connect: [
            {
                success: true,
                payload: [
                    {
                        type: 'final',
                        max: '100000000',
                    },
                ],
            },
            {
                success: true,
                payload: [
                    {
                        type: 'nonfinal',
                        max: '100000000',
                    },
                ],
            },
            {
                success: true,
                payload: [
                    {
                        type: 'nonfinal',
                        max: '100000000',
                    },
                ],
            },
            {
                success: true,
                payload: [
                    {
                        type: 'final',
                        totalSpent: '120000000',
                    },
                ],
            },
        ],
        actions: [
            {
                type: 'input',
                element: 'outputs[0].address',
                value: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                result: {
                    composeTransactionCalls: 0,
                    composedLevels: undefined,
                },
            },
            {
                type: 'hover',
                element: 'outputs[0].amount',
            },
            {
                type: 'click',
                element: 'outputs[0].setMax',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [
                            {
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '1',
                                fiat: '1.00',
                            },
                        ],
                    },
                    composedLevels: {
                        normal: { type: 'final' },
                    },
                },
            },
            // add second output
            {
                type: 'click',
                element: 'add-output',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [
                            {
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '1',
                                fiat: '1.00',
                            },
                            { address: '' },
                        ],
                    },
                    composedLevels: {
                        normal: { type: 'final' },
                    },
                },
            },
            // fill address in second output
            {
                type: 'input',
                element: 'outputs[1].address',
                value: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                result: {
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [
                            {
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '1',
                                fiat: '1.00',
                            },
                            { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '' },
                        ],
                    },
                    composeTransactionParams: {
                        outputs: [
                            // corner-case: send-max was changed to send-max-noaddress
                            // see sendFormUtils.getBitcoinComposeOutput
                            {
                                type: 'send-max-noaddress',
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                            },
                        ],
                    },
                },
            },
            // disable send max
            {
                type: 'click',
                element: 'outputs[0].setMax',
                result: {
                    formValues: {
                        setMaxOutputId: undefined,
                    },
                    composeTransactionParams: {
                        outputs: [
                            // corner-case: external was changed to noaddress
                            // see sendFormUtils.getBitcoinComposeOutput
                            {
                                type: 'noaddress',
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '100000000',
                            },
                        ],
                    },
                },
            },
            // fill fiat in second output
            {
                type: 'input',
                element: 'outputs[1].fiat',
                value: '0.20',
                result: {
                    formValues: {
                        outputs: [
                            {
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '1',
                                fiat: '1.00',
                            },
                            {
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '0.20000000',
                                fiat: '0.20',
                            },
                        ],
                    },
                    composeTransactionParams: {
                        outputs: [
                            {
                                type: 'external',
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '100000000',
                            },
                            {
                                type: 'external',
                                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                                amount: '20000000',
                            },
                        ],
                    },
                },
            },
            // remove second output
            // {
            //     type: 'click',
            //     element: 'outputs[1].remove',
            //     result: {
            //         composeTransactionParams: {
            //             outputs: [
            //                 { type: 'external', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '100000000' }
            //             ]
            //         },
            //     },
            // }
        ],
        finalResult: {
            composeTransactionCalls: 4,
            formValues: {
                setMaxOutputId: undefined,
                outputs: [
                    { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' },
                    {
                        address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                        amount: '0.20000000',
                        fiat: '0.20',
                    },
                ],
            },
            composedLevels: {
                normal: {
                    type: 'final',
                    totalSpent: '120000000',
                },
            },
        },
    },
    {
        description: 'ETH',
        store: {
            send: {
                drafts: getDraft({
                    setMaxOutputId: 0,
                }),
            },
            selectedAccount: ETH_ACCOUNT,
        },
        finalResult: {
            estimateFeeCalls: 1,
            composedLevels: {
                normal: {
                    type: 'final',
                    fee: '63000000000000',
                    totalSpent: '10000000000000000000',
                },
                custom: undefined,
            },
            formValues: {
                outputs: [{ amount: '9.999937', fiat: '10.00' }],
            },
        },
    },
    {
        description: 'ETH with token',
        store: {
            send: {
                drafts: getDraft({
                    outputs: [
                        {
                            ...DEFAULT_PAYMENT,
                            address: '0xABCD',
                            token: '0xABCD',
                        },
                    ],
                    setMaxOutputId: 0,
                }),
            },
            selectedAccount: ETH_ACCOUNT,
        },
        finalResult: {
            estimateFeeCalls: 1,
            composedLevels: {
                normal: {
                    type: 'final',
                    fee: '63000000000000',
                    totalSpent: '1000', // tokens
                },
                custom: undefined,
            },
            formValues: {
                outputs: [{ amount: '1', token: '0xABCD' }],
            },
        },
    },
    {
        description: 'XRP',
        store: {
            send: {
                drafts: getDraft({
                    setMaxOutputId: 0,
                }),
            },
            selectedAccount: XRP_ACCOUNT,
        },
        finalResult: {
            getAccountInfoCalls: 1,
            composedLevels: {
                normal: { type: 'final', fee: '12', totalSpent: '100000000' },
                custom: undefined,
            },
            formValues: {
                outputs: [{ amount: '99.999988', fiat: '100.00' }],
            },
        },
    },
    {
        description: 'XRP no address',
        store: {
            send: {
                drafts: getDraft({
                    outputs: [{ ...DEFAULT_PAYMENT }],
                    setMaxOutputId: 0,
                }),
            },
            selectedAccount: XRP_ACCOUNT,
        },
        finalResult: {
            getAccountInfoCalls: 0,
            composedLevels: {
                normal: { type: 'nonfinal', fee: '12', totalSpent: '100000000' },
                custom: undefined,
            },
            formValues: {
                outputs: [{ amount: '99.999988', fiat: '100.00' }],
            },
        },
    },
];

export const amountChange = [
    {
        description: 'Amount to Fiat calculation',
        // input amount
        // input amount with error
        // change currency
    },
    {
        description: 'Amount with error',
        // input amount
        // input amount with error
        // change currency
    },
    {
        description: 'Amount to Fiat calculation then Amount with error',
        // input amount
        // input amount with error
        // change currency
    },
    {
        description: 'Fiat to Amount calculation',
        // input fiat
        // input fiat with error
        // change currency
    },
    {
        description: 'Fiat with error',
        // input fiat
        // input fiat with error
        // change currency
    },
    {
        description: 'Fiat to Amount calculation then Fiat with error',
        // input fiat
        // input fiat with error
        // change currency
    },
    {
        description: 'Eth transaction with data (default amount set to 0)',
    },
];

const getComposeResponse = (resp?: any) => ({
    success: true,
    payload: [
        {
            type: 'final',
            totalSpent: '2500000000',
            fee: '100',
            transaction: {
                inputs: [{ amount: '12500000000', prev_hash: 'utxoC' }],
                outputs: [
                    { address_n: [44, 0, 0, 1, 1], amount: '10000000000' },
                    { address: 'A-external', amount: '2499999900' },
                ],
            },
        },
    ],
    ...resp,
});

export const signAndPush = [
    {
        description: 'ETH',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: ETH_ACCOUNT,
        },
        connect: [
            undefined, // estimateFee
            {
                success: true,
                payload: {
                    serializedTx: 'serializedABCD',
                },
            },
        ],
        result: {
            formValues: {
                selectedFee: undefined,
                outputs: [{ address: '', amount: '' }], // form was cleared
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'tx-sent', formattedAmount: '1 ETH' }, // BUG ?
                },
                {
                    type: 'mock-redirect',
                },
            ],
        },
    },
    {
        description: 'ETH failed',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: ETH_ACCOUNT,
        },
        result: {
            formValues: {
                selectedFee: undefined,
                outputs: [{ amount: '1' }], // form not cleared
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'sign-tx-error' },
                },
            ],
        },
    },
    {
        description: 'XRP',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: XRP_ACCOUNT,
        },
        connect: [
            undefined, // getAccountInfo address check
            {
                success: true,
                payload: {
                    serializedTx: 'serializedABCD',
                },
            },
        ],
        result: {
            formValues: {
                selectedFee: undefined,
                outputs: [{ address: '', amount: '' }], // form was cleared
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'tx-sent', formattedAmount: '1 XRP' },
                },
                {
                    type: 'mock-redirect',
                },
            ],
        },
    },
    {
        description: 'XRP failed',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: XRP_ACCOUNT,
        },
        result: {
            formValues: {
                selectedFee: undefined,
                outputs: [{ amount: '1' }], // form not cleared
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'sign-tx-error' },
                },
            ],
        },
    },
    // {
    //     description: 'XRP',
    //     store: {
    //         send: {
    //             drafts: getDraft(),
    //         },
    //         selectedAccount: XRP_ACCOUNT,
    //     },
    //     // connect: [
    //     //     { success: false, payload: { error: 'irrelevant ' } }, // getAccountInfo address check
    //     //     // { success: true, payload: {} },
    //     // ],
    //     result: {
    //         formValues: {
    //             selectedFee: undefined,
    //             outputs: [{ address: '', amount: '' }], // form was cleared
    //         },
    //         actions: [1],
    //     },
    // },
    {
        description: 'Success with: custom fee, 2 outputs, 0 utxo (ignored)',
        store: {
            send: {
                drafts: getDraft({
                    selectedFee: 'custom' as const,
                    outputs: [
                        {
                            ...DEFAULT_PAYMENT,
                            address: 'A',
                            amount: '1',
                        },
                        {
                            ...DEFAULT_PAYMENT,
                            address: 'B',
                            amount: '2',
                        },
                    ],
                }),
            },
        },
        connect: [
            getComposeResponse({
                payload: [
                    {
                        // normal fee level, not used in this test
                        type: 'final',
                        totalSpent: '2500000000',
                        fee: '200',
                        transaction: {
                            inputs: [],
                            outputs: [],
                        },
                    },
                    {
                        // custom fee level, used
                        type: 'final',
                        totalSpent: '2500000000', // 2200000000 are externals + fee
                        fee: '100',
                        transaction: {
                            inputs: [
                                { amount: '0', prev_hash: 'should not be used' },
                                { amount: '12500000000', prev_hash: 'utxoC' },
                            ],
                            outputs: [
                                { address_n: [44, 0, 0, 1, 1], amount: '10000000000' },
                                { address: 'A-external', amount: '2100000000' },
                                { address: '1-unused', amount: '100000000' },
                                { address: '2-used', amount: '100000000' },
                                { address: '1-change', amount: '100000000' },
                                { address: 'B-external', amount: '99999900' },
                            ],
                        },
                    },
                ],
            }),
            {
                success: true,
                payload: {
                    serializedTx: 'serializedABCD',
                },
            },
        ],
        result: {
            formValues: {
                selectedFee: undefined,
                outputs: [{ address: '', amount: '' }], // form was cleared
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'tx-sent', formattedAmount: '24.999999 BTC' },
                },
                {
                    type: '@account/update',
                    payload: {
                        // reduced balance
                        availableBalance: '97800000000',
                        formattedBalance: '978',
                        utxo: [
                            // new utxos created by this tx
                            {
                                address: '1-change',
                                amount: '100000000',
                                vout: 4,
                                txid: 'txid',
                                blockHeight: 0,
                                confirmations: 0,
                                path: "m/44'/0'/0'/1/0",
                            },
                            {
                                address: '2-used',
                                amount: '100000000',
                                vout: 3,
                                txid: 'txid',
                                blockHeight: 0,
                                confirmations: 0,
                                path: "m/44'/0'/0'/0/1",
                            },
                            {
                                address: '1-unused',
                                amount: '100000000',
                                vout: 2,
                                txid: 'txid',
                                blockHeight: 0,
                                confirmations: 0,
                                path: "m/44'/0'/0'/0/2",
                            },
                            {
                                address: '2-change',
                                amount: '10000000000',
                                vout: 0,
                                txid: 'txid',
                                blockHeight: 0,
                                confirmations: 0,
                                path: "m/44'/0'/0'/1/1",
                            },
                            // old utxo without used "utxoC"
                            { txid: 'should-never-be-used', amount: '0' },
                            { txid: 'utxoA', amount: '50000000000' },
                            { txid: 'utxoB', amount: '25000000000' },
                            { txid: 'utxoD', amount: '6250000000' },
                            { txid: 'utxoE', amount: '6250000000' },
                        ],
                    },
                },
                {
                    type: 'mock-redirect',
                },
            ],
        },
    },
    {
        description: 'Error during signing',
        store: {
            send: {
                drafts: getDraft(),
            },
        },
        connect: [
            getComposeResponse(),
            {
                success: false,
                payload: {
                    error: 'signTx error',
                },
            },
        ],
        result: {
            formValues: {
                outputs: [{ address: 'A', amount: '1' }],
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'sign-tx-error' },
                },
            ],
        },
    },
    {
        description: 'Error during signing (cancelled)',
        store: {
            send: {
                drafts: getDraft(),
            },
        },
        connect: [
            getComposeResponse(),
            {
                success: false,
                payload: {
                    error: 'tx-cancelled',
                },
            },
        ],
        result: {
            formValues: {
                outputs: [{ address: 'A', amount: '1' }],
            },
            actions: [], // silent error - no toast
        },
    },
    {
        description: 'Error during pushing',
        store: {
            send: {
                drafts: getDraft(),
            },
        },
        connect: [
            getComposeResponse(),
            {
                success: true,
                payload: {
                    serializedTx: 'serializedABCD',
                },
            },
            {
                success: false,
                payload: {
                    error: 'pushTx error',
                },
            },
        ],
        result: {
            formValues: {
                outputs: [{ address: 'A', amount: '1' }],
            },
            actions: [
                {
                    type: '@notification/toast',
                    payload: { type: 'sign-tx-error' },
                },
            ],
        },
    },
];

export const feeChange = [
    {
        description: 'BTC fee changes',
        store: {
            send: {
                drafts: getDraft(),
            },
            fees: {
                btc: {
                    minFee: 1,
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    // add more levels
                    levels: [
                        { label: 'high', feePerUnit: '40', blocks: 1 },
                        { label: 'normal', feePerUnit: '4', blocks: 1 },
                        { label: 'low', feePerUnit: '1', blocks: 1 },
                    ],
                },
            },
        },
        connect: {
            success: false,
            payload: {
                success: false,
                payload: {
                    error: 'compose-response-is-irrelevant',
                },
            },
        },
        actionSequence: [
            {
                type: 'click',
                element: 'select-bar/high',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        selectedFee: 'high' as const,
                        feePerUnit: '',
                    },
                },
            },
            {
                type: 'click',
                element: 'select-bar/custom',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '40', // from high level
                    },
                },
            },
            {
                type: 'click',
                element: 'select-bar/custom',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '40', // from high level
                    },
                },
            },
            {
                type: 'click',
                element: 'select-bar/low',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        selectedFee: 'low' as const,
                        feePerUnit: '40', // did not changed
                    },
                },
            },
            {
                type: 'click',
                element: 'select-bar/custom',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '1', // from low level
                    },
                },
            },
            {
                type: 'input',
                element: 'feePerUnit',
                value: '', // reset value
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        feePerUnit: '',
                    },
                    errors: {
                        feePerUnit: { message: 'CUSTOM_FEE_IS_NOT_SET' },
                    },
                },
            },
            {
                type: 'input',
                element: 'feePerUnit',
                value: '2', // add new custom
                result: {
                    composeTransactionCalls: 2,
                    formValues: {
                        feePerUnit: '2',
                    },
                    errors: {},
                },
            },
            {
                type: 'input',
                element: 'feePerUnit',
                value: 'a', // add invalid
                result: {
                    composeTransactionCalls: 2,
                    formValues: {
                        feePerUnit: '2a',
                    },
                    errors: {
                        feePerUnit: { message: 'CUSTOM_FEE_IS_NOT_NUMBER' },
                    },
                },
            },
            {
                type: 'click',
                element: 'select-bar/normal',
                result: {
                    composeTransactionCalls: 3, // called after fee level change
                    formValues: {
                        selectedFee: 'normal' as const,
                        feePerUnit: '',
                    },
                },
            },
        ],
        finalResult: {
            composeTransactionCalls: 3,
        },
    },
    {
        description: 'ETH fee limit changes',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: ETH_ACCOUNT,
        },
        // blockchainEstimateFee responses
        connect: [
            {
                success: false,
                payload: {
                    error: 'irrelevant',
                },
            },
            {
                success: true,
                payload: {
                    levels: [{ feeLimit: '41000' }],
                },
            },
            {
                success: true,
                payload: {
                    levels: [{ feeLimit: '21009' }],
                },
            },
        ],
        actionSequence: [
            {
                type: 'click',
                element: 'select-bar/custom',
                result: {
                    estimateFeeCalls: 1,
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '3',
                        feeLimit: '21000', // default
                        estimatedFeeLimit: undefined,
                    },
                },
            },
            {
                type: 'input',
                element: 'outputs[0].amount',
                value: '.1',
                result: {
                    estimateFeeCalls: 2,
                    formValues: {
                        outputs: [{ amount: '1.1' }],
                        feePerUnit: '3',
                        feeLimit: '41000', // feeLimit is switched automatically
                        estimatedFeeLimit: '41000',
                    },
                },
            },
            // trigger "gas limit below recommended" error
            {
                type: 'input',
                element: 'feeLimit',
                value: '{backspace}',
                result: {
                    estimateFeeCalls: 2,
                    formValues: {
                        outputs: [{ amount: '1.1' }],
                        feePerUnit: '3',
                        feeLimit: '4100',
                        estimatedFeeLimit: '41000',
                    },
                    errors: {
                        feeLimit: { type: 'validate' }, // limit below recommended error
                    },
                },
            },
            // im not currently able to click on error button
            // increasing fee level to accepted value
            {
                type: 'input',
                element: 'feeLimit',
                value: '0',
                result: {
                    estimateFeeCalls: 3,
                    formValues: {
                        outputs: [{ amount: '1.1' }],
                        selectedFee: 'custom' as const,
                        feePerUnit: '3',
                        feeLimit: '21009', // feeLimit is switched automatically again
                        estimatedFeeLimit: '21009',
                    },
                    composedLevels: {
                        normal: {
                            type: 'final',
                            feeLimit: '21009',
                            estimatedFeeLimit: '21009',
                        },
                        custom: {
                            type: 'final',
                            feeLimit: '41000', // custom composed tx with higher level (as requested)
                            estimatedFeeLimit: '21009',
                        },
                    },
                    errors: {
                        feeLimit: undefined,
                    }, // no errors
                },
            },
            // reset value
            {
                type: 'input',
                element: 'feeLimit',
                value: '',
                result: {
                    estimateFeeCalls: 3,
                    formValues: {
                        feeLimit: '',
                        estimatedFeeLimit: '21009',
                    },
                    composedLevels: undefined, // no levels
                    errors: {
                        feeLimit: { type: 'required' }, // not set error
                    },
                },
            },
            {
                type: 'input',
                element: 'feeLimit',
                value: '21', // too low
                result: {
                    formValues: {
                        feeLimit: '21',
                    },
                    errors: {
                        feeLimit: { type: 'validate' }, // limit error
                    },
                },
            },
            {
                type: 'input',
                element: 'feeLimit',
                value: 'a', // typo
                result: {
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '3',
                        feeLimit: '21a',
                        estimatedFeeLimit: '21009',
                    },
                    errors: {
                        feeLimit: { type: 'validate' }, // limit error
                    },
                },
            },
            {
                type: 'click',
                element: 'send/open-ethereum-data',
            },
            {
                type: 'click',
                element: 'send/close-ethereum-data',
            },
            // switch back to normal
            {
                type: 'click',
                element: 'select-bar/normal',
                result: {
                    estimateFeeCalls: 4, // called after fee level change
                    formValues: {
                        selectedFee: 'normal' as const,
                        feePerUnit: '',
                        feeLimit: '',
                        estimatedFeeLimit: undefined, // because of missing response from connect
                    },
                    composedLevels: {
                        normal: {
                            type: 'final',
                            fee: '63000000000000',
                            feePerByte: '3',
                            feeLimit: '21000', // default
                        },
                        custom: undefined, // no custom level build
                    },
                    errors: {
                        feeLimit: undefined, // no levels,
                    }, // no errors
                },
            },
        ],
        finalResult: {
            estimateFeeCalls: 4,
        },
    },
    {
        description: 'XRP fee changes',
        store: {
            send: {
                drafts: getDraft(),
            },
            selectedAccount: XRP_ACCOUNT,
        },
        // getAccountInfo responses
        connect: [
            {
                success: true,
                payload: {
                    empty: true,
                    misc: { reserve: '20000000' },
                },
            },
            // {
            //     success: true,
            //     payload: {
            //         levels: [{ feeLimit: '41000' }],
            //     },
            // },
            // {
            //     success: true,
            //     payload: {
            //         levels: [{ feeLimit: '21009' }],
            //     },
            // },
        ],
        actionSequence: [
            {
                type: 'click',
                element: 'select-bar/custom',
                result: {
                    getAccountInfoCalls: 1,
                    formValues: {
                        selectedFee: 'custom' as const,
                        feePerUnit: '12',
                    },
                    composedLevels: {
                        normal: {
                            type: 'error', // not enough to cover reserve
                        },
                    },
                    errors: {
                        outputs: [
                            {
                                amount: { type: 'compose' }, // AMOUNT_IS_LESS_THAN_RESERVE
                            },
                        ],
                    },
                },
            },
            {
                type: 'input',
                element: 'feePerUnit',
                value: '', // reset value
                result: {
                    getAccountInfoCalls: 1,
                    formValues: {
                        feePerUnit: '',
                    },
                    composedLevels: undefined,
                    errors: {
                        feePerUnit: { message: 'CUSTOM_FEE_IS_NOT_SET' },
                    },
                },
            },
            {
                type: 'input',
                element: 'feePerUnit',
                value: '10',
                result: {
                    getAccountInfoCalls: 2,
                    formValues: {
                        feePerUnit: '10',
                    },
                    composedLevels: {
                        normal: {
                            type: 'final',
                            fee: '12', // default
                        },
                        custom: {
                            type: 'final',
                            fee: '10', // default
                        },
                    },
                    errors: {
                        feePerUnit: undefined,
                    },
                },
            },
        ],
        finalResult: {
            getAccountInfoCalls: 2,
        },
    },
];
