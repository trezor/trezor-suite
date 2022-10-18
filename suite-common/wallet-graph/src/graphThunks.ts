import { differenceInMinutes, eachMinuteOfInterval, getUnixTime, subMinutes } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectAccountsByNetworkSymbols } from '@suite-common/wallet-core';

import { EnhancedAccountBalanceHistory, LineGraphTimeFrameValues } from './types';
import {
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
    getLineGraphAllTimeStepInMinutes,
} from './graphUtils';
import { timeSwitchItems } from './config';
import { actionPrefix } from './graphActions';
import { AccountBalanceHistory } from '@trezor/blockchain-link';

const sortAccountBalanceHistoryByTimeAsc = (accountBalanceMovements: AccountBalanceHistory[]) => {
    return accountBalanceMovements.sort((a, b) => {
        return a.time - b.time;
    });
};

const getSuccessAccountBalanceMovements = (
    accountBalanceMovements: Array<EnhancedAccountBalanceHistory | undefined>,
) => {
    const successOldestAccountMovementTime = [];
    for (let oldestAccountMovement of accountBalanceMovements) {
        if (oldestAccountMovement?.time) {
            successOldestAccountMovementTime.push(oldestAccountMovement);
        }
    }
    return successOldestAccountMovementTime;
};

const fetchAccountsBalanceHistory = async (
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
                const responseWithRates = await ensureHistoryRates(
                    account.symbol,
                    response.payload,
                );
                const enhancedResponse = enhanceBlockchainAccountHistory(
                    responseWithRates,
                    account.symbol,
                );
                return enhancedResponse;
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
        }
    });
    const accountBalanceMovements = await Promise.all(promises);
    const successOldestAccountMovementTime = getSuccessAccountBalanceMovements(
        accountBalanceMovements.flat(),
    );
    const sortedAccountBalanceMovements = sortAccountBalanceHistoryByTimeAsc(
        successOldestAccountMovementTime,
    );
    return sortedAccountBalanceMovements;
};

const getOldestAccountBalanceMovement = async (account: Account) => {
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        groupBy: 3600 * 24, // day
    });
    if (response?.success) {
        const { payload } = response;
        const sortedAccountBalanceMovements = sortAccountBalanceHistoryByTimeAsc(payload);
        return sortedAccountBalanceMovements[0];
    }
};

const getOldestAccountBalanceMovementTimestampFromAllAccounts = async (accounts: Account[]) => {
    const promises = accounts.map(async account => {
        return getOldestAccountBalanceMovement(account);
    });
    const accountBalanceMovements = await Promise.all(promises);
    const successOldestAccountMovementTime =
        getSuccessAccountBalanceMovements(accountBalanceMovements);
    return Math.min(...successOldestAccountMovementTime.map(movement => movement.time));
};

const getAccountBalanceAtStartOfRange = async (account: Account, startOfRangeDate: Date) => {
    const oldestAccountBalanceMovement = await getOldestAccountBalanceMovement(account);
    if (oldestAccountBalanceMovement?.time) {
        const oldestAccountBalanceMovementTimestamp = oldestAccountBalanceMovement.time;
        const accountBalanceHistoryToStartOfRange = await fetchAccountsBalanceHistory([account], {
            from: getBlockbookSafeTime(getUnixTime(oldestAccountBalanceMovementTimestamp)),
            to: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
            groupBy: 3600 * 24, // day
        });
        return accountBalanceHistoryToStartOfRange[accountBalanceHistoryToStartOfRange.length - 1];
    }
};

const getValueBackInMinutes = async (
    accounts: Account[],
    timeFrame: LineGraphTimeFrameValues,
): Promise<number> => {
    const { valueBackInMinutes } = timeSwitchItems[timeFrame];
    if (valueBackInMinutes) {
        return valueBackInMinutes;
    }
    const oldestAccountBalanceChangeUnixTime =
        await getOldestAccountBalanceMovementTimestampFromAllAccounts(accounts);
    return differenceInMinutes(new Date(), new Date(oldestAccountBalanceChangeUnixTime * 1000));
};

export const getGraphPointsForSingleAccountThunk = createThunk(
    `${actionPrefix}/getGraphPointsForSingleAccountThunk`,
    async (timeFrame: LineGraphTimeFrameValues, { getState }) => {},
);

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

        // FIXME do not hardcode first account
        const accountBalanceAtStartOfRange = await getAccountBalanceAtStartOfRange(
            accounts[0],
            startOfRangeDate,
        );

        // TODO process these account data and merge all data together
        await fetchAccountsBalanceHistory(accounts, {
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
