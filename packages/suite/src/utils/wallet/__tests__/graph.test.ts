import * as utils from '../graphUtils';

const ratesETH = {
    symbol: 'eth',
    rates: {
        czk: 3007.1079886708517,
        eos: 36.852136278995445,
        eur: 117.13118845579191,
        gbp: 100.43721437661289,
        aaa: undefined,
    },
    timestamp: Date.now(),
} as const;

const valueMap1 = {
    czk: '100',
    aaa: undefined,
} as const;

const valueMap2 = {
    czk: '0.0001',
    eur: '0.000000000000001',
    aaa: undefined,
    b: undefined,
    c: '3',
} as const;

const account1Dev1 = global.JestMocks.getWalletAccount({
    descriptor: 'abc',
    symbol: 'btc',
    deviceState: 'abc123',
});

const account2Dev1 = global.JestMocks.getWalletAccount({
    descriptor: 'xyz',
    symbol: 'btc',
    deviceState: 'abc123',
});

const account1Dev2 = global.JestMocks.getWalletAccount({
    descriptor: 'abc',
    symbol: 'btc',
    deviceState: 'xyz123',
});

const graphData1 = {
    account: account1Dev1,
    error: false,
    isLoading: false,
    data: [],
};

const rates = {
    czk: 3007.1079886708517,
    eos: 36.852136278995445,
    eur: 117.13118845579191,
    gbp: 100.43721437661289,
    aaa: undefined,
};
const graphData2 = {
    account: account1Dev1,
    error: false,
    isLoading: false,
    data: [
        {
            balance: '0',
            time: 1561932000,
            txs: 14,
            received: '0.1',
            sent: '0.1',
            rates,
        },
        {
            balance: '-0.003',
            time: 1580511600,
            txs: 2,
            received: '0.2',
            sent: '0.23',
            rates,
        },
    ],
};
const graphData3 = {
    account: account2Dev1,
    error: false,
    isLoading: false,
    data: [
        {
            time: 1561932000,
            txs: 14,
            received: '1',
            sent: '1',
            rates,
        },
        {
            time: 1580511600,
            txs: 2,
            received: '1.2',
            sent: '1.2',
            rates,
        },
    ],
};

describe('Graph utils', () => {
    test('calcFiatValueMap', () => {
        expect(utils.calcFiatValueMap('2', ratesETH.rates)).toStrictEqual({
            czk: '6014.22',
            eos: '73.70',
            eur: '234.26',
            gbp: '200.87',
            aaa: '0',
        });
    });

    test('sumFiatValueMap', () => {
        const valueMap1Copy = { ...valueMap1 };
        utils.sumFiatValueMapInPlace(valueMap1Copy, valueMap2);
        expect(valueMap1Copy).toStrictEqual({
            czk: '100.0001',
            eur: '0.000000000000001',
            aaa: '0',
            b: '0',
            c: '3',
        });
    });

    test('accountGraphDataFilterFn', () => {
        expect(utils.accountGraphDataFilterFn(graphData1, account1Dev1)).toBe(true);
        expect(utils.accountGraphDataFilterFn(graphData1, account1Dev2)).toBe(false);
        expect(utils.accountGraphDataFilterFn(graphData1, account2Dev1)).toBe(false);
    });

    test('accountGraphDataFilterFn', () => {
        expect(utils.deviceGraphDataFilterFn(graphData1, account1Dev1.deviceState)).toBe(true);
        expect(utils.deviceGraphDataFilterFn(graphData1, account1Dev2.deviceState)).toBe(false);
        expect(utils.deviceGraphDataFilterFn(graphData1, account2Dev1.deviceState)).toBe(true);
    });

    test('aggregateBalanceHistory group by month', () => {
        expect(utils.aggregateBalanceHistory([graphData1, graphData1], 'month', 'account')).toEqual(
            [],
        );
        expect(utils.aggregateBalanceHistory([graphData1, graphData2], 'month', 'account')).toEqual(
            [
                {
                    balance: '0',
                    received: '0.1',
                    receivedFiat: {
                        aaa: '0',
                        czk: '300.71',
                        eos: '3.69',
                        eur: '11.71',
                        gbp: '10.04',
                    },
                    sent: '0.1',
                    sentFiat: {
                        aaa: '0',
                        czk: '300.71',
                        eos: '3.69',
                        eur: '11.71',
                        gbp: '10.04',
                    },
                    balanceFiat: {
                        aaa: '0',
                        czk: '0.00',
                        eos: '0.00',
                        eur: '0.00',
                        gbp: '0.00',
                    },
                    time: 1559347200,
                    txs: 14,
                },
                {
                    balance: '-0.003',
                    received: '0.2',
                    sent: '0.23',
                    receivedFiat: {
                        aaa: '0',
                        czk: '601.42',
                        eos: '7.37',
                        eur: '23.43',
                        gbp: '20.09',
                    },
                    sentFiat: {
                        aaa: '0',
                        czk: '691.63',
                        eos: '8.48',
                        eur: '26.94',
                        gbp: '23.10',
                    },
                    balanceFiat: {
                        aaa: '0',
                        czk: '-9.02',
                        eos: '-0.11',
                        eur: '-0.35',
                        gbp: '-0.30',
                    },
                    time: 1577836800,
                    txs: 2,
                },
            ],
        );
        // @ts-expect-error
        expect(utils.aggregateBalanceHistory([graphData2, graphData3], 'day', 'account')).toEqual([
            {
                received: '1.1',
                sent: '1.1',
                receivedFiat: {
                    aaa: '0',
                    czk: '3307.82',
                    eos: '40.54',
                    eur: '128.84',
                    gbp: '110.48',
                },
                sentFiat: {
                    aaa: '0',
                    czk: '3307.82',
                    eos: '40.54',
                    eur: '128.84',
                    gbp: '110.48',
                },
                time: 1561932000,
                txs: 28,
                balance: '0',
                balanceFiat: {
                    aaa: '0',
                    czk: '0',
                    eos: '0',
                    eur: '0',
                    gbp: '0',
                },
            },
            {
                received: '1.4',
                sent: '1.43',
                receivedFiat: {
                    aaa: '0',
                    czk: '4209.95',
                    eos: '51.59',
                    eur: '163.99',
                    gbp: '140.61',
                },
                sentFiat: {
                    aaa: '0',
                    czk: '4300.16',
                    eos: '52.7',
                    eur: '167.5',
                    gbp: '143.62',
                },
                balance: '-0.003',
                balanceFiat: {
                    aaa: '0',
                    czk: '-9.02',
                    eos: '-0.11',
                    eur: '-0.35',
                    gbp: '-0.3',
                },
                time: 1580511600,
                txs: 4,
            },
        ]);
    });
});
