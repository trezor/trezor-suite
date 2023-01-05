import {
    DEFAULT_TARGET_ANONYMITY,
    ESTIMATED_MIN_ROUNDS_NEEDED,
} from '../../../services/coinjoin/config';
import * as coinjoinUtils from '../coinjoinUtils';

const baseUtxo = {
    txid: '1',
    vout: 1,
    amount: '100',
    blockHeight: 100,
    path: 'string',
    confirmations: 100,
};

export const breakdownParams: Parameters<typeof coinjoinUtils.breakdownCoinjoinBalance>[0] = {
    targetAnonymity: 80,
    anonymitySet: {
        one: 1,
        two: 100,
        three: 30,
    },
    utxos: [
        {
            address: 'one',
            ...baseUtxo,
        },
        {
            address: 'two',
            ...baseUtxo,
        },
        {
            address: 'three',
            ...baseUtxo,
        },
    ],
};

const baseCalculateProgressParams: Omit<
    Parameters<typeof coinjoinUtils.calculateAnonymityProgress>[0],
    'utxos'
> = {
    targetAnonymity: 80,
    anonymitySet: {
        one: 1,
        two: 100,
        three: 30,
        four: 50,
        five: 70,
    },
};

export const calculateProgressParams: Array<{
    params: Parameters<typeof coinjoinUtils.calculateAnonymityProgress>[0];
    result: number;
}> = [
    {
        params: {
            ...baseCalculateProgressParams,
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                    amount: '100',
                },
                {
                    address: 'two',
                    ...baseUtxo,
                    amount: '125',
                },
                {
                    address: 'three',
                    ...baseUtxo,
                    amount: '50',
                },
                {
                    address: 'four',
                    ...baseUtxo,
                    amount: '75',
                },
                {
                    address: 'five',
                    ...baseUtxo,
                    amount: '200',
                },
            ],
        },
        result: 66,
    },
    {
        params: {
            ...baseCalculateProgressParams,
            anonymitySet: { one: 1 },
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                    amount: '100',
                },
            ],
        },
        result: 0,
    },
    {
        params: {
            ...baseCalculateProgressParams,
            anonymitySet: { one: 10 },
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                    amount: '100',
                },
            ],
        },
        result: 11,
    },
    {
        params: {
            ...baseCalculateProgressParams,
            anonymitySet: { one: 100, two: 100 },
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                    amount: '100',
                },
                {
                    address: 'two',
                    ...baseUtxo,
                    amount: '125',
                },
            ],
        },
        result: 100,
    },
    {
        params: {
            ...baseCalculateProgressParams,
            anonymitySet: {},
            utxos: [],
        },
        result: 0,
    },
];

export const getMaxRounds = [
    {
        description: 'default target anonymity',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: 1,
                two: 100,
                three: 30,
                four: 5,
            },
        },
        result: 8,
    },
    {
        description: 'default target anonymity every utxos with some anonymity',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: 5,
                two: 100,
                three: 30,
            },
        },
        result: 8,
    },
    {
        description: 'no target anonymity',
        params: {
            targetAnonymity: 1,
            anonymitySet: {
                one: 5,
                two: 100,
                three: 30,
                four: 1,
            },
        },
        result: ESTIMATED_MIN_ROUNDS_NEEDED,
    },
    {
        description: 'highest target anonymity',
        params: {
            targetAnonymity: 100,
            anonymitySet: {
                one: 1,
                two: 100,
                three: 30,
            },
        },
        result: 25,
    },
    {
        description: 'target anonymity achieved',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: DEFAULT_TARGET_ANONYMITY,
            },
        },
        result: ESTIMATED_MIN_ROUNDS_NEEDED,
    },
    {
        description: 'target anonymity surpassed',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: DEFAULT_TARGET_ANONYMITY + 1,
                two: 100,
            },
        },
        result: ESTIMATED_MIN_ROUNDS_NEEDED,
    },
    {
        description: 'anonymity set with undefined value',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: undefined,
                two: 100,
                three: 30,
            },
        },
        result: 8,
    },
    {
        description: 'anonymity set with 0 value',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {
                one: 0,
                two: 100,
                three: 30,
            },
        },
        result: 8,
    },
    {
        description: 'anonymity set empty',
        params: {
            targetAnonymity: DEFAULT_TARGET_ANONYMITY,
            anonymitySet: {},
        },
        result: 8,
    },
];
