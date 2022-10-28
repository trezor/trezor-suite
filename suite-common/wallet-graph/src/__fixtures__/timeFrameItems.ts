import BigNumber from 'bignumber.js';

export const timeFrameItemsWithBalanceAndUsdRates = [
    {
        txs: 2,
        received: '0.001',
        sent: '0.001',
        sentToSelf: '0',
        time: 1420671600,
        rates: {
            usd: 284.4525,
        },
        balance: '0',
        fiatCurrencyRate: 284.4525,
        descriptor: 'zpubxyz',
    },
    {
        txs: 2,
        received: '0.001',
        sent: '0.001',
        sentToSelf: '0',
        time: 1421190000,
        rates: {
            usd: 172.1479,
        },
        balance: '00',
        fiatCurrencyRate: 172.1479,
        descriptor: 'zpubxyz',
    },
    {
        txs: 11,
        received: '0.02172381',
        sent: '0.02028683',
        sentToSelf: '618331',
        time: 1422486000,
        rates: {
            usd: 232.5329422304941,
        },
        balance: '0.00143698',
        fiatCurrencyRate: 232.5329422304941,
        descriptor: 'zpubxyz',
    },
    {
        time: 1423004400,
        rates: {
            usd: 225.3083,
        },
        balance: '0.00143698',
        fiatCurrencyRate: 225.3083,
        descriptor: 'zpubxyz',
    },
    {
        time: 1424818800,
        rates: {
            usd: 237.378,
        },
        balance: '0.00143698',
        fiatCurrencyRate: 237.378,
        descriptor: 'zpubxyz',
    },
    {
        time: 1426633200,
        rates: {
            usd: 255.6062,
        },
        balance: '0.00143698',
        fiatCurrencyRate: 255.6062,
        descriptor: 'zpubxyz',
    },
    {
        txs: 3,
        received: '0.00113698',
        sent: '0.00257396',
        sentToSelf: '0',
        time: 1427925600,
        rates: {
            usd: 252.341,
        },
        balance: '0',
        fiatCurrencyRate: 252.341,
        descriptor: 'zpubxyz',
    },
    {
        time: 1428447600,
        rates: {
            usd: 244.2709,
        },
        balance: '0',
        fiatCurrencyRate: 244.2709,
        descriptor: 'zpubxyz',
    },
    {
        time: 1430262000,
        rates: {
            usd: 225.9978,
        },
        balance: '0',
        fiatCurrencyRate: 225.9978,
        descriptor: 'zpubxyz',
    },
    {
        txs: 1,
        received: '0.00093698',
        sent: '0',
        sentToSelf: '0',
        time: 1431554400,
        rates: {
            usd: 236.704,
        },
        balance: '0.00093698',
        fiatCurrencyRate: 236.704,
        descriptor: 'zpubxyz',
    },
    {
        time: 1432076400,
        rates: {
            usd: 234.048,
        },
        balance: '0.00093698',
        fiatCurrencyRate: 234.048,
        descriptor: 'zpubxyz',
    },
    {
        txs: 4,
        received: '0.00043698',
        sent: '0.00137396',
        sentToSelf: '63698',
        time: 1433368800,
        rates: {
            usd: 224.1748,
        },
        balance: '0',
        fiatCurrencyRate: 224.1748,
        descriptor: 'zpubxyz',
    },
    {
        time: 1433890800,
        rates: {
            usd: 229.0022,
        },
        balance: '0',
        fiatCurrencyRate: 229.0022,
        descriptor: 'zpubxyz',
    },
    {
        txs: 9,
        received: '0.14895862',
        sent: '0.14875862',
        sentToSelf: '60000',
        time: 1435183200,
        rates: {
            usd: 242.4769,
        },
        balance: '0.0002',
        fiatCurrencyRate: 242.4769,
        descriptor: 'zpubxyz',
    },
    {
        time: 1435705200,
        rates: {
            usd: 257.5058,
        },
        balance: '0.0002',
        fiatCurrencyRate: 257.5058,
        descriptor: 'zpubxyz',
    },
    {
        txs: 20,
        received: '0.00312316',
        sent: '0.00332316',
        sentToSelf: '0',
        time: 1436997600,
        rates: {
            usd: 276.6800999999999,
        },
        balance: '0',
        fiatCurrencyRate: 276.6800999999999,
        descriptor: 'zpubxyz',
    },
];

export const timeFrameItemsWithBalanceAndUsdRatesWithExpectedValueWithExpectedValue =
    timeFrameItemsWithBalanceAndUsdRates.map(item => {
        const { balance, fiatCurrencyRate } = item;
        return {
            ...item,
            expectedValue: new BigNumber(balance).multipliedBy(fiatCurrencyRate).toNumber(),
        };
    });
