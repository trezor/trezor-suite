import { calculateValues, getInvestmentChain } from './calculateValues';

const fiatRates = [
    {
        date: '2023-01-01T23:00:00.000Z',
        value: 100,
    },
    {
        date: '2023-01-02T23:00:00.000Z',
        value: 200,
    },
    {
        date: '2023-01-03T23:00:00.000Z',
        value: 300,
    },
    {
        date: '2023-01-04T23:00:00.000Z',
        value: 500,
    },
    {
        date: '2023-01-05T23:00:00.000Z',
        value: 500,
    },
    {
        date: '2023-01-06T23:00:00.000Z',
        value: 550,
    },
];

describe('calculateValues', () => {
    it('getInvestments', () => {
        const input = [
            {
                date: '2023-01-01T23:00:00.000Z',
                value: 0.00184128,
            },
            {
                date: '2023-01-03T23:00:00.000Z',
                value: 0.00169704,
            },
            {
                date: '2023-01-04T23:00:00.000Z',
                value: 0.00167484,
            },
            {
                date: '2023-01-06T23:00:00.000Z',
                value: 0.00159938,
            },
        ];
        const output = {
            '2023-01-01T23:00:00.000Z': { fiatRate: 100, value: 0.00184128 },
            '2023-01-03T23:00:00.000Z': { fiatRate: 300, value: -0.00014424 },
            '2023-01-04T23:00:00.000Z': { fiatRate: 500, value: -0.0000222 },
            '2023-01-06T23:00:00.000Z': { fiatRate: 550, value: -0.00007546 },
        };

        expect(getInvestmentChain(fiatRates, input)).toEqual(output);
    });
    it('calculateValues', () => {
        const balanceData = [
            {
                date: '2023-01-01',
                value: 10,
            },
            {
                date: '2023-01-02',
                value: 10,
            },
            {
                date: '2023-01-03',
                value: 30,
            },
            {
                date: '2023-01-04',
                value: 20,
            },
        ];

        const output = [
            {
                date: '2023-01-01',
                fiatValue: 1000,
                fiatValueInvestment: 10 * 100,
                value: 10,
            },
            {
                date: '2023-01-02',
                fiatValue: 2000,
                fiatValueInvestment: 10 * 100,
                value: 10,
            },
            {
                date: '2023-01-03',
                fiatValue: 9000,
                fiatValueInvestment: 10 * 100 + 20 * 300, // 7000
                value: 30,
            },
            {
                date: '2023-01-04',
                fiatValue: 10000,
                fiatValueInvestment: 10 * 100 + 20 * 300 - 10 * 500, // 2000
                value: 20,
            },
        ];

        const result = calculateValues({ fiatRates, balanceData });
        console.log('___', result);
        expect(result).toEqual(output);
    });
});
