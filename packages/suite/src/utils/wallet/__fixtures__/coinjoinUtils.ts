import {
    DEFAULT_TARGET_ANONYMITY,
    ESTIMATED_MIN_ROUNDS_NEEDED,
} from '../../../services/coinjoin/config';

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
