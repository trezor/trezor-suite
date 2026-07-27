import {
    type CanLocktimeTxBeBroadcastParams,
    canLocktimeTxBeBroadcast,
} from '../canLocktimeTxBeBroadcast';

const data: Array<{
    it: string;
    input: CanLocktimeTxBeBroadcastParams;
    result: boolean;
}> = [
    {
        it: 'succeeds for no locktime ',
        input: {
            locktimeBlockHeight: undefined,
            locktimeDatetime: undefined,
            currentBlockHeight: 10000,
        },
        result: true,
    },
    {
        it: 'succeeds for locktime less then current hash ',
        input: {
            locktimeBlockHeight: 120,
            locktimeDatetime: undefined,
            currentBlockHeight: 150,
        },
        result: true,
    },
    {
        it: 'succeeds for locktime === current hash ',
        input: {
            locktimeBlockHeight: 150,
            locktimeDatetime: undefined,
            currentBlockHeight: 150,
        },
        result: true,
    },
    {
        it: 'errors for locktime more then current hash',
        input: {
            locktimeBlockHeight: 151,
            locktimeDatetime: undefined,
            currentBlockHeight: 150,
        },
        result: false,
    },
    {
        it: 'succeeds for datetime in the past',
        input: {
            locktimeBlockHeight: undefined,
            locktimeDatetime: 1720703392,
            currentBlockHeight: 10000,
        },
        result: true,
    },
    {
        it: 'errors for datetime in the future',
        input: {
            locktimeBlockHeight: undefined,
            locktimeDatetime: 2147483647,
            currentBlockHeight: 10000,
        },
        result: false,
    },
];

describe.each(data)(canLocktimeTxBeBroadcast.name, data => {
    it(data.it, () => {
        expect(canLocktimeTxBeBroadcast(data.input)).toBe(data.result);
    });
});
