import { DEFAULT_PAYMENT, DEFAULT_OPTIONS, DEFAULT_VALUES } from '@wallet-constants/sendForm';

export const BTC_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'btc',
        networkType: 'bitcoin',
        descriptor: 'xpub',
        deviceState: 'deviceState',
        key: 'xpub-btc-deviceState',
        addresses: { change: [], used: [], unused: [] },
        availableBalance: '100000000000',
        utxo: [],
    },
    network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8 },
};

export const ETH_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'eth',
        networkType: 'ethereum',
        descriptor: '0xdB09b793984B862C430b64B9ed53AcF867cC041F',
        deviceState: 'deviceState',
        key: '0xdB09b793984B862C430b64B9ed53AcF867cC041F-eth-deviceState',
        availableBalance: '100000000000',
    },
    network: { networkType: 'ethereum', symbol: 'eth', decimals: 16 },
};

export const XRP_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'xrp',
        networkType: 'ripple',
        descriptor: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY',
        deviceState: 'deviceState',
        key: 'rAPERVgXZavGgiGv6xBgtiZurirW2yAmY-eth-deviceState',
        availableBalance: '100000000000',
    },
    network: { networkType: 'ripple', symbol: 'xrp', decimals: 6 },
};

export const DEFAULT_STORE = {
    suite: { device: {}, settings: { debug: {} } },
    wallet: {
        accounts: [], // used by auto-labeling
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
            ],
        },
    },
    devices: [], // to remove?
};

const DEFAULT_DRAFT = {
    ...DEFAULT_VALUES,
    options: [...DEFAULT_OPTIONS],
    outputs: [{ ...DEFAULT_PAYMENT }],
};

export const addingOutputs = [
    {
        description: 'Add/Remove/Reset outputs without draft',
        initial: {
            outputs: [{ address: '' }],
        },
        actions: [
            {
                button: 'add-output',
                result: {
                    outputs: [{ address: '' }, { address: '' }],
                },
            },
            {
                button: 'outputs[0].remove',
                result: {
                    outputs: [{ address: '' }],
                },
            },
            {
                button: 'clear-form',
                result: {
                    outputs: [{ address: '' }],
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
                button: 'add-output',
                result: {
                    outputs: [{ address: 'A' }, { address: 'B' }, { address: '' }],
                    setMaxOutputId: 1,
                },
            },
            {
                button: 'outputs[0].remove',
                result: {
                    outputs: [{ address: 'B' }, { address: '' }],
                    setMaxOutputId: 0,
                },
            },
            {
                button: 'clear-form',
                result: {
                    outputs: [{ address: '' }],
                    setMaxOutputId: undefined,
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
                button: 'add-output',
                result: {
                    outputs: [{ address: 'A' }, { address: 'B' }, { address: '' }],
                    setMaxOutputId: 0,
                },
            },
            {
                button: 'outputs[0].remove',
                result: {
                    outputs: [{ address: 'B' }, { address: '' }],
                    setMaxOutputId: undefined,
                },
            },
            {
                button: 'clear-form',
                result: {
                    outputs: [{ address: '' }],
                    setMaxOutputId: undefined,
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
        typing: { element: 'outputs[0].address', value: 'X', delay: 0 },
        results: {
            connectCalledTimes: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ address: { message: 'RECIPIENT_IS_NOT_SET' } }],
            },
        },
    },
    {
        description: 'compose with validation errors (Address invalid)',
        typing: { element: 'outputs[0].address', value: 'FOO', delay: 1 },
        results: {
            connectCalledTimes: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ address: { message: 'RECIPIENT_IS_NOT_VALID' } }],
            },
        },
    },
    {
        description: 'compose with validation errors (Amount not a number)',
        typing: { element: 'outputs[0].amount', value: '11a', delay: 1 },
        results: {
            connectCalledTimes: 0,
            composedLevels: undefined,
            errors: {
                outputs: [{ amount: { message: 'AMOUNT_IS_NOT_NUMBER' } }],
            },
        },
    },
    {
        description: 'trezor-connect call respond with success:false',
        connect: {
            response: {
                success: false,
                payload: { error: 'error' },
            },
        },
        typing: { element: 'outputs[0].amount', value: '1', delay: 0 },
        results: {
            connectCalledTimes: 1,
            composedLevels: undefined,
        },
    },
    {
        description: 'Fast typing, one trezor-connect call',
        connect: {
            response: {
                success: true,
                payload: [
                    {
                        type: 'nonfinal',
                    },
                ],
            },
        },
        typing: { element: 'outputs[0].amount', value: '111', delay: 100 },
        results: {
            connectCalledTimes: 1,
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
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '100000000' }],
                },
            },
            {
                // delay in trezor-connect response greater than typing delay
                // basically it means: return this response AFTER third call to connect, this response should be ignored
                delay: 500,
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '1100000000' }],
                },
            },
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '11100000000' }],
                },
            }, // delay in trezor-connect response, greater than typing delay
        ],
        typing: { element: 'outputs[0].amount', value: '111', delay: 310 }, // delay greater than composeDebounced timeout
        results: {
            connectCalledTimes: 3,
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
            response: {
                success: true,
                payload: [
                    {
                        type: 'nonfinal',
                        max: '100000000',
                    },
                ],
            },
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
                response: {
                    success: true,
                    payload: [
                        {
                            type: 'error',
                        },
                    ],
                },
            },
            {
                response: {
                    success: true,
                    payload: [
                        { type: 'error' },
                        { type: 'final', feePerByte: '2', max: '10000000' },
                        { type: 'final', feePerByte: '1', max: '10000001' },
                    ],
                },
            },
        ],
        finalResult: {
            composeTransactionCalls: 2,
            composedLevels: { normal: { type: 'error' }, custom: { type: 'final' } },
            formValues: {
                selectedFee: 'custom',
                feePerUnit: '2',
                outputs: [{ amount: '0.1', fiat: '0.10' }],
            },
        },
    },
    {
        description:
            'setMax sequence: compose not final (without address) then add address',
        connect: [
            {
                response: {
                    success: true,
                    payload: [
                        {
                            type: 'nonfinal',
                            max: '100000000',
                        },
                    ],
                },
            },
            {
                response: {
                    success: true,
                    payload: [
                        { 
                            type: 'final',
                            max: '100000000',
                        },
                    ],
                },
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
                        outputs: [
                            { type: 'send-max-noaddress' }
                        ]
                    },
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [{ address: '', amount: '1', fiat: '1.00' }],
                    },
                    composedLevels: {
                        normal: { type: 'nonfinal' },
                    }
                }
            },
            {
                type: 'input',
                element: 'outputs[0].address',
                value: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
                result: {
                    composeTransactionParams: {
                        outputs: [
                            { type: 'send-max', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX' }
                        ]
                    },
                },
            },
        ],
        finalResult: {
            composeTransactionCalls: 2,
            formValues: {
                setMaxOutputId: 0,
                outputs: [{ address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' }],
            },
            composedLevels: {
                normal: { type: 'final' },
            }
        },
    },
    {
        description:
            'setMax sequence: compose final with address, disable setMax, add second output',
        connect: [
            {
                response: {
                    success: true,
                    payload: [
                        { 
                            type: 'final',
                            max: '100000000',
                        },
                    ],
                },
            },
            {
                response: {
                    success: true,
                    payload: [
                        { 
                            type: 'nonfinal',
                            max: '100000000',
                        },
                    ],
                },
            },
            {
                response: {
                    success: true,
                    payload: [
                        { 
                            type: 'nonfinal',
                            max: '100000000',
                        },
                    ],
                },
            },
            {
                response: {
                    success: true,
                    payload: [
                        { 
                            type: 'final',
                            totalSpent: '120000000',
                        },
                    ],
                },
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
                }
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
                        outputs: [{ address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' }],
                    },
                    composedLevels: {
                        normal: { type: 'final' },
                    }
                }
            },
            // add second output
            {
                type: 'click',
                element: 'add-output',
                result: {
                    composeTransactionCalls: 1,
                    formValues: {
                        setMaxOutputId: 0,
                        outputs: [{ address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' }, { address: '' }],
                    },
                    composedLevels: {
                        normal: { type: 'final' },
                    }
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
                            { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' },
                            { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '' }
                        ],
                    },
                    composeTransactionParams: {
                        outputs: [
                            // corner-case: send-max was changed to send-max-noaddress
                            // see sendFormUtils.getBitcoinComposeOutput
                            { type: 'send-max-noaddress', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX' }
                        ]
                    },
                }
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
                            { type: 'noaddress', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '100000000' }
                        ]
                    },
                }
            },
            // fill fiat in second output
            {
                type: 'input',
                element: 'outputs[1].fiat',
                value: '0.20',
                result: {
                    formValues: {
                        outputs: [
                            { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '1', fiat: '1.00' },
                            { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '0.20000000', fiat: '0.20' }
                        ],
                    },
                    composeTransactionParams: {
                        outputs: [
                            { type: 'external', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '100000000' },
                            { type: 'external', address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '20000000' }
                        ]
                    },
                }
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
                    { address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX', amount: '0.20000000', fiat: '0.20' }
                ],
            },
            composedLevels: {
                normal: {
                    type: 'final',
                    totalSpent: '120000000',
                },
            }
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
