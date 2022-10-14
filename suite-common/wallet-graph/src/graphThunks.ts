import { differenceInMinutes, eachMinuteOfInterval, getUnixTime, subMinutes } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectAccountsByNetworkSymbols } from '@suite-common/wallet-core';

import { LineGraphTimeFrameValues } from './types';
import { getLineGraphAllTimeStepInMinutes } from './graphUtils';
import { timeSwitchItems } from './config';
import { actionPrefix } from './graphActions';

const getOldestAccountBalanceMovementTimestamp = async (accounts: Account[]) => {
    const promises = accounts.map(async account => {
        const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: account.symbol,
            descriptor: account.descriptor,
            groupBy: 3600 * 24, // day
        });
        try {
            if (response?.success) {
                const { payload } = response;
                return payload.map(balanceGroup => balanceGroup.time);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
        }
        return [];
    });
    const accountBalanceTimestamps = await Promise.all(promises);
    return Math.min(...accountBalanceTimestamps.flat());
};

const getValueBackInMinutes = async (
    accounts: Account[],
    timeFrame: LineGraphTimeFrameValues,
): Promise<number> => {
    const { valueBackInMinutes } = timeSwitchItems[timeFrame];
    if (valueBackInMinutes) {
        return valueBackInMinutes;
    }
    const oldestAccountBalanceChangeUnixTime = await getOldestAccountBalanceMovementTimestamp(
        accounts,
    );
    return differenceInMinutes(new Date(), new Date(oldestAccountBalanceChangeUnixTime * 1000));
};

const fetchAccountsGraphData = async (
    accounts: Account[],
    { from, to, groupBy }: { from: number; to: number; groupBy: number },
) => {
    const promises = accounts.map(async account => {
        const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: account.symbol,
            descriptor: account.descriptor,
            from,
            to,
            groupBy,
        });
        try {
            if (response?.success) {
                // TODO
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
        }
    });
    const groupedAccountBalance = await Promise.all(promises);
    // TODO recalculate historic rates etc.
    return groupedAccountBalance;
};

export const getGraphPointsForAccountsThunk = createThunk(
    `${actionPrefix}/getGraphPointsForAccountsThunk`,
    async (
        {
            section,
            timeFrame,
        }: {
            section: 'dashboard' | 'account';
            timeFrame: LineGraphTimeFrameValues;
        },
        { getState },
    ) => {
        const endOfRangeDate = new Date();

        // FIXME mobile app currently supports only btc so it is hardcoded for now
        const accounts = selectAccountsByNetworkSymbols(getState(), ['btc']);

        const valueBackInMinutes = await getValueBackInMinutes(accounts, timeFrame);
        const stepInMinutes =
            timeSwitchItems[timeFrame]?.stepInMinutes ??
            getLineGraphAllTimeStepInMinutes(endOfRangeDate, valueBackInMinutes);

        const timeFrameItem = {
            ...timeSwitchItems[timeFrame],
            valueBackInMinutes,
            stepInMinutes,
        };

        const startOfRangeDate = subMinutes(endOfRangeDate, timeFrameItem.valueBackInMinutes);

        const datesInRange = eachMinuteOfInterval(
            {
                start: startOfRangeDate.getTime(),
                end: endOfRangeDate.getTime(),
            },
            {
                step: stepInMinutes,
            },
        );
        const datesInRangeUnixTime = datesInRange.map(date =>
            getBlockbookSafeTime(getUnixTime(date)),
        );

        // FIXME mobile app currently supports only btc so it is hardcoded for now
        const fiatRatesForDatesInRange = await getFiatRatesForTimestamps(
            { symbol: 'btc' },
            datesInRangeUnixTime,
        )
            .then(res => (res?.tickers || []).map(({ ts, rates }) => [ts, rates]))
            .then(res => Object.fromEntries(res));

        // TODO these are graph points
        const mappedDatesInRange = Object.keys(fiatRatesForDatesInRange).map(timestamp => {
            const fiatRates = fiatRatesForDatesInRange[timestamp];
            return {
                date: new Date(Number(timestamp) * 1000),
                value: Math.floor(fiatRates.usd), // FIXME add selected currency
            };
        });

        // TODO process these account data and merge all data together
        await fetchAccountsGraphData(accounts, {
            from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
            to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
            groupBy: stepInMinutes * 60,
        });

        // TODO merge all points together
        return {
            section,
            points: mappedDatesInRange,
        };
    },
);
