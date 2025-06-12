import { enhanceBalanceGraphDataForEachStep } from './useGraphData';

const startBalance = 1000;

const currentRange = {
    startDate: new Date('2023-01-01T00:00:00.000Z'),
    endDate: new Date('2023-01-06T00:00:00.000Z'),
};
const input = [
    { date: '2023-01-01T00:00:00.000Z', value: 100 },
    { date: '2023-01-02T00:00:00.000Z', value: 200 },
    { date: '2023-01-03T00:00:00.000Z', value: 50 },
    { date: '2023-01-04T00:00:00.000Z', value: 0 },
    { date: '2023-01-05T00:00:00.000Z', value: -80 },
    { date: '2023-01-06T00:00:00.000Z', value: 100 },
];

const output = [
    {
        date: '2023-01-01T00:00:00.000Z',
        value: 1000,
    },
    {
        date: '2023-01-02T00:00:00.000Z',
        value: 1200,
    },
    {
        date: '2023-01-03T00:00:00.000Z',
        value: 1050,
    },
    {
        date: '2023-01-04T00:00:00.000Z',
        value: 1050,
    },
    {
        date: '2023-01-05T00:00:00.000Z',
        value: 920,
    },
    {
        date: '2023-01-06T00:00:00.000Z',
        value: 1100,
    },
];
// const output = [
//     { date: '2023-01-01T00:00:00.000Z', value: 1100 },
//     { date: '2023-01-02T00:00:00.000Z', value: 1300 },
//     { date: '2023-01-05T00:00:00.000Z', value: 1270 },
//     { date: '2023-01-06T00:00:00.000Z', value: 1370 },
// ];

describe('useGraphData', () => {
    it('enhanceBalanceGraphDataForEachStep', () => {
        expect(enhanceBalanceGraphDataForEachStep(startBalance, currentRange, input)).toEqual(
            output,
        );
    });
});
