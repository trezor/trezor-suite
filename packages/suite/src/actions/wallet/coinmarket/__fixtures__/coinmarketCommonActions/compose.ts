import { NETWORKS } from '@wallet-config';
import { BTC_ACCOUNT, ETH_ACCOUNT, XRP_ACCOUNT } from './accounts';

const { getSuiteDevice } = global.JestMocks;
const AVAILABLE_DEVICE = getSuiteDevice({ available: true, connected: true });

export const COMPOSE_TRANSACTION_FIXTURES = [
    {
        description: 'composeTransaction, bitcoin account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: BTC_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'btc' && n.accountType === 'normal'),
                selectedFee: 'normal',
                isMaxActive: false,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' }],
                },
            },
        ],
        result: {
            value: { normal: { type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' } },
            actions: [],
        },
    },
    {
        description: 'composeTransaction, bitcoin account, normal, max',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: BTC_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'btc' && n.accountType === 'normal'),
                selectedFee: 'normal',
                isMaxActive: true,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' }],
                },
            },
        ],
        result: {
            value: { normal: { type: 'nonfinal', totalSpent: '10000000', feePerByte: '1' } },
            actions: [],
        },
    },
    {
        description: 'composeTransaction, bitcoin account, lastKnownFee',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: BTC_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [{ label: 'normal', feePerUnit: '2', blocks: 0 }],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'btc' && n.accountType === 'normal'),
                minFee: '1',
                selectedFee: 'normal',
                isMaxActive: false,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: [],
                },
            },
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '2' }],
                },
            },
        ],
        result: {
            value: { custom: { type: 'nonfinal', totalSpent: '10000000', feePerByte: '2' } },
            actions: [],
        },
    },
    {
        description: 'composeTransaction, bitcoin account, failure',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: BTC_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [
                        { label: 'normal', feePerUnit: '1', blocks: 0 },
                        { label: 'custom', feePerUnit: '1', blocks: 0 },
                    ],
                },
                feePerUnit: '2',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'btc' && n.accountType === 'normal'),
                selectedFee: 'custom',
                isMaxActive: false,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: false,
                    payload: { error: 'error' },
                },
            },
        ],
        result: {
            value: undefined,
            actions: [
                {
                    payload: {
                        context: 'toast',
                        device: AVAILABLE_DEVICE,
                        error: 'error',
                        seen: true,
                        type: 'sign-tx-error',
                    },
                    type: '@notification/toast',
                },
            ],
        },
    },
    {
        description: 'composeTransaction, ethereum account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: ETH_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [
                        {
                            label: 'normal',
                            feePerUnit: '2',
                            blocks: 0,
                        },
                    ],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'eth'),
                minFee: '1',
                selectedFee: 'normal',
                ethereumDataHex: '0x1212',
                isMaxActive: false,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: { levels: [{ feeLimit: '1234' }] },
                },
            },
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '2' }],
                },
            },
        ],
        result: {
            value: {
                normal: {
                    type: 'nonfinal',
                    totalSpent: '123402468000000000',
                    feePerByte: '2',
                    bytes: 0,
                    fee: '2468000000000',
                    feeLimit: '1234',
                    estimatedFeeLimit: '1234',
                },
            },
            actions: [],
        },
    },
    {
        description: 'composeTransaction, ethereum account, normal, max',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: ETH_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [
                        {
                            label: 'normal',
                            feePerUnit: '2',
                            blocks: 0,
                        },
                    ],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'eth'),
                minFee: '1',
                selectedFee: 'normal',
                ethereumDataHex: '0x1212',
                isMaxActive: true,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: { levels: [{ feeLimit: '1234' }] },
                },
            },
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '2' }],
                },
            },
        ],
        result: {
            value: {
                normal: {
                    type: 'nonfinal',
                    max: '0.408871360678601',
                    totalSpent: '408873828678601000',
                    feePerByte: '2',
                    bytes: 0,
                    fee: '2468000000000',
                    feeLimit: '1234',
                    estimatedFeeLimit: '1234',
                },
            },
            actions: [],
        },
    },
    {
        description: 'composeTransaction, ripple account, normal',
        initialState: {
            suite: {
                device: AVAILABLE_DEVICE,
            },
        },
        params: {
            data: {
                account: XRP_ACCOUNT,
                amount: '0.1234',
                feeInfo: {
                    blockHeight: 50000,
                    blockTime: 3,
                    minFee: 1,
                    maxFee: 40000,
                    levels: [
                        {
                            label: 'normal',
                            feePerUnit: '2',
                            blocks: 0,
                        },
                    ],
                },
                feePerUnit: '1',
                feeLimit: '0',
                network: NETWORKS.find(n => n.symbol === 'xrp'),
                minFee: '1',
                selectedFee: 'normal',
                isMaxActive: false,
                isInvity: true,
            },
        },
        connect: [
            {
                response: {
                    success: true,
                    payload: { levels: [{ feeLimit: '1234' }] },
                },
            },
            {
                response: {
                    success: true,
                    payload: [{ type: 'nonfinal', totalSpent: '10000000', feePerByte: '2' }],
                },
            },
        ],
        result: {
            value: {
                normal: {
                    type: 'nonfinal',
                    totalSpent: '123402',
                    feePerByte: '2',
                    bytes: 0,
                    fee: '2',
                },
            },
            actions: [],
        },
    },
];
