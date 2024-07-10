import {
    canLocktimeTxBeBroadcast,
    CanLocktimeTxBeBroadcastParams,
} from '../canLocktimeTxBeBroadcast';

const data: Array<{ it: string; input: CanLocktimeTxBeBroadcastParams; result: boolean }> = [
    {
        it: 'succeeds for no locktime ',
        input: { locktime: undefined, currentBlockHeight: 10000 },
        result: true,
    },
    {
        it: 'succeeds for locktime less then current hash ',
        input: { locktime: 120, currentBlockHeight: 150 },
        result: true,
    },
    {
        it: 'succeeds for locktime === current hash ',
        input: { locktime: 150, currentBlockHeight: 150 },
        result: true,
    },
    {
        it: 'fails for locktime more then current hash',
        input: { locktime: 151, currentBlockHeight: 150 },
        result: false,
    },
    {
        it: 'succeeds for locktime that is timestamp 500000000',
        input: { locktime: 1720703392, currentBlockHeight: 10000 },
        result: true,
    },
];

describe.each(data)(canLocktimeTxBeBroadcast.name, data => {
    it(data.it, () => {
        expect(canLocktimeTxBeBroadcast(data.input)).toBe(data.result);
    });
});
