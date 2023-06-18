import { ANONYMITY_GAINS_HINDSIGHT_COUNT } from 'src/services/coinjoin';
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
    {
        params: {
            ...baseCalculateProgressParams,
            targetAnonymity: 1,
            anonymitySet: { one: 10 },
            utxos: [
                {
                    address: 'one',
                    ...baseUtxo,
                },
            ],
        },
        result: 100,
    },
];

export const cleanAnonymityGains: Array<{
    params: Parameters<typeof coinjoinUtils.cleanAnonymityGains>[0];
    resultLength: number;
}> = [
    {
        params: new Array(ANONYMITY_GAINS_HINDSIGHT_COUNT + 1).fill({
            level: 3,
            timestamp: Date.now(),
        }),
        resultLength: ANONYMITY_GAINS_HINDSIGHT_COUNT,
    },
    { params: [{ level: 3, timestamp: 0 }], resultLength: 0 },
];

export const averageAnonymityGainsParams: Array<{
    params: Parameters<typeof coinjoinUtils.calculateAverageAnonymityGainPerRound>;
    checkResult: (average: number) => boolean;
}> = [
    { params: [2, [{ level: 3, timestamp: Date.now() }]], checkResult: x => x > 2 },
    { params: [2, [{ level: 1, timestamp: Date.now() }]], checkResult: x => x < 2 },
    { params: [2, [{ level: 2, timestamp: Date.now() }]], checkResult: x => x === 2 },
    { params: [2, undefined], checkResult: x => x === 2 },
];
