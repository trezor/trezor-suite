import { timeSwitchItems } from '../config';
import {
    singleAccountTimeFrameAccountBalanceArrayAtTheBeginning,
    singleAccount1HourTimeFrameAccountBalanceHistory,
    singleAccount1DayTimeFrameAccountBalanceHistory,
    singleAccount1WeekTimeFrameAccountBalanceHistory,
} from './blockbook';
import { balanceMovementsBeforeStart1Hour } from './accountBalanceHistory';

export const timeFramesFixtures = {
    hour: {
        ...timeSwitchItems.hour,
        connectMocks: {
            accountBalanceAtTheBeginning: singleAccountTimeFrameAccountBalanceArrayAtTheBeginning,
            accountBalanceHistoryInTimeFrame: singleAccount1HourTimeFrameAccountBalanceHistory,
            balanceMovementsInTimeFrameRatesBefore: balanceMovementsBeforeStart1Hour,
            balanceMovementsInTimeFrameRates: {
                success: true,
                payload: [],
            },
        },
        results: {
            firstAccountBalanceMovement: {
                received: '0.00521229',
                sent: '0',
                sentToSelf: '0',
                time: 1665612000,
                balance: '0.00521229',
            },
            expectedAccountBalanceHistoryInTimeFrameLength: 0,
        },
    },
    /*
    day: {
        ...timeSwitchItems.day,
        connectMocks: {
            accountBalanceAtTheBeginning: singleAccountTimeFrameAccountBalanceArrayAtTheBeginning,
            accountBalanceHistoryInTimeFrame: singleAccount1DayTimeFrameAccountBalanceHistory,
        },
        results: {
            expectedAccountBalanceHistoryInTimeFrameLength: 0,
        },
    },
    week: {
        ...timeSwitchItems.week,
        connectMocks: {
            accountBalanceAtTheBeginning: singleAccountTimeFrameAccountBalanceArrayAtTheBeginning,
            accountBalanceHistoryInTimeFrame: singleAccount1WeekTimeFrameAccountBalanceHistory,
        },
        results: {
            expectedAccountBalanceHistoryInTimeFrameLength: 3,
        },
    },
     */
    /*
    month: {
        ...timeSwitchItems.month,
    },
    year: {
        ...timeSwitchItems.year,
    },
     */
    // TODO all
};
