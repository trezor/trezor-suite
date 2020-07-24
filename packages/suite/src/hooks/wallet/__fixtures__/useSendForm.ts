export const DEFAULT_STORE = {
    suite: { device: {}, settings: { debug: {} } },
    labeling: {}, // will not be used in the future
    wallet: {
        accounts: [],
        selectedAccount: {
            status: 'loaded',
            account: {
                symbol: 'btc',
                networkType: 'bitcoin',
                descriptor: 'xpub',
                deviceState: 'deviceState',
                addresses: { change: [], used: [], unused: [] },
                availableBalance: '100000000000',
                utxo: [],
            },
            network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8 },
        },
        settings: {
            localCurrency: 'usd',
            debug: {},
        },
        fees: { btc: { levels: [] } },
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
        send: {
            precomposedTx: undefined,
            lastUsedFeeLevel: undefined,
            drafts: {},
        },
    },
    devices: [],
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
        state: {
            drafts: {
                'xpub-btc-deviceState': {
                    formState: {
                        outputs: [
                            {
                                address: 'A',
                                amount: '1',
                            },
                            {
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
        state: {
            drafts: {
                'xpub-btc-deviceState': {
                    formState: {
                        outputs: [
                            {
                                address: 'A',
                                amount: '1',
                            },
                            {
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
                outputs: [{ address: { message: 'TR_ADDRESS_IS_NOT_SET' } }],
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
                outputs: [{ address: { message: 'TR_ADDRESS_IS_NOT_VALID' } }],
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
                outputs: [{ amount: { message: 'TR_AMOUNT_IS_NOT_NUMBER' } }],
            },
        },
    },
    {
        description: 'trezor-connect call respond with success:false',
        connect: {
            response: {
                success: false,
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
        typing: { element: 'outputs[0].amount', value: '111', delay: 301 }, // delay greater than composeDebounced timeout
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
        state: {
            drafts: {
                'xpub-btc-deviceState': {
                    formState: {
                        outputs: [
                            {
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
        results: {
            connectCalledTimes: 1,
            composedLevels: {
                normal: {
                    type: 'nonfinal',
                },
            },
            values: {
                selectedFee: undefined,
                outputs: [{ address: '', amount: '1', fiat: '1.00' }],
            },
        },
    },
    {
        description:
            'setMax: compose from draft with error on default level, switching to custom level',
        state: {
            drafts: {
                'xpub-btc-deviceState': {
                    formState: {
                        outputs: [
                            {
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
        results: {
            connectCalledTimes: 2,
            composedLevels: { normal: { type: 'error' }, custom: { type: 'final' } },
            values: {
                selectedFee: 'custom',
                feePerUnit: '2',
                outputs: [{ amount: '0.1', fiat: '0.10' }],
            },
        },
    },
];
