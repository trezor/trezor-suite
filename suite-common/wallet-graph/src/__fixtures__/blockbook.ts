export const getMockedBlockBookRatesForTimestamps = (timestamps: number[]) =>
    timestamps.map(ts => ({
        time: ts,
        rates: {
            usd: 19340.7,
        },
    }));

export const singleAccountTimeFrameAccountBalanceArrayAtTheBeginning = {
    success: true,
    payload: [
        {
            time: 1665666480,
            txs: 1,
            received: '521229',
            sent: '0',
            sentToSelf: '0',
            rates: {
                usd: 18999.54,
            },
        },
        {
            time: 1666021380,
            txs: 1,
            received: '521088',
            sent: '521229',
            sentToSelf: '521088',
            rates: {
                usd: 19553.11,
            },
        },
        {
            time: 1666483199,
            txs: 1,
            received: '521088',
            sent: '0',
            sentToSelf: '0',
            rates: {
                usd: 20123.05,
            },
        },
    ],
};

// no movement in the last 1 hour
export const singleAccount1HourTimeFrameAccountBalanceHistory = {
    success: true,
    payload: [],
};

// no movement in the last 1 day
export const singleAccount1DayTimeFrameAccountBalanceHistory = {
    success: true,
    payload: [],
};

// FIXME this is not a response from blockbook - it is enhanced
export const singleAccount1WeekTimeFrameAccountBalanceHistory = {
    success: true,
    payload: [
        {
            balance: '0.00521229',
            rates: {
                usd: 19018.42,
            },
            received: '0.00521229',
            sent: '0',
            sentToSelf: '0',
            time: 1665612000,
            txs: 1,
        },
        {
            balance: '0.00521088',
            rates: {
                usd: 19451.45,
            },
            received: '0',
            sent: '0.00000141',
            sentToSelf: '521088',
            time: 1665957600,
            txs: 1,
        },
        {
            balance: '0.01042176',
            rates: {
                usd: 20123.05,
            },
            received: '0.00521088',
            sent: '0',
            sentToSelf: '0',
            time: 1666476000,
            txs: 1,
        },
    ],
};
