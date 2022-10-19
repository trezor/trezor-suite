import { differenceInMinutes, eachMinuteOfInterval, getUnixTime, subMinutes } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectAccountsByNetworkSymbols, selectAccountByKey } from '@suite-common/wallet-core';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import {
    LineGraphTimeFrameItemAccountBalance,
    LineGraphTimeFrameValues,
    LineGraphTimeFrameConfiguration,
    GraphSection,
} from './types';
import {
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
    getSuccessAccountBalanceMovements,
    getTimeFrameConfiguration,
    sortTimeFrameItemsByTimeAsc,
} from './graphUtils';
import { timeSwitchItems } from './config';
import { actionPrefix } from './graphActions';

type GetGraphPointsForAccountsThunkPayload = {
    section: GraphSection;
    fiatCurrency: FiatCurrencyCode;
    timeFrame: LineGraphTimeFrameValues;
};

type GetGraphPointsForSingleAccountThunk = {
    accountKey: string;
    fiatCurrency: FiatCurrencyCode;
    timeFrame: LineGraphTimeFrameValues;
};

const fetchAccountBalanceHistory = async (
    account: Account,
    { from, to, groupBy }: { from?: number; to?: number; groupBy: number },
) => {
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        from,
        to,
        groupBy,
    });
    if (response?.success) {
        const responseWithRates = await ensureHistoryRates(account.symbol, response.payload);
        const enhancedResponse = enhanceBlockchainAccountHistory(responseWithRates, account.symbol);
        const sortedAccountBalanceHistory = sortTimeFrameItemsByTimeAsc(enhancedResponse);
        const successAccountBalanceMovements = getSuccessAccountBalanceMovements(
            sortedAccountBalanceHistory,
        );
        return successAccountBalanceMovements;
    }
    return [];
};

const getOldestAccountBalanceMovement = async (account: Account) => {
    const accountBalanceHistory = await fetchAccountBalanceHistory(account, {
        groupBy: 3600 * 24, // day
    });
    return accountBalanceHistory?.[0];
};

const getOldestAccountBalanceMovementTimestampFromAllAccounts = async (accounts: Account[]) => {
    const fallbackMovement = new Date(0).getTime(); // in case of fetching error erc.
    const promises = accounts.map(account => getOldestAccountBalanceMovement(account));
    const accountBalanceMovements = await Promise.all(promises);
    const successOldestAccountMovementTime = accountBalanceMovements
        ? getSuccessAccountBalanceMovements(accountBalanceMovements)
        : [];
    return successOldestAccountMovementTime.length
        ? Math.min(...successOldestAccountMovementTime.map(movement => movement.time))
        : fallbackMovement;
};

/**
 * We need to know what is the account balance at the beginning of selected graph time frame
 * (to have balance history as a continuous line).
 * @param account
 * @param startOfRangeDate
 */
const getAccountBalanceAtStartOfRange = async (
    account: Account,
    startOfRangeDate: Date,
): Promise<LineGraphTimeFrameItemAccountBalance> => {
    const accountBalanceHistoryToStartOfRange = await fetchAccountBalanceHistory(account, {
        to: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
        groupBy: 3600, // day
    });
    if (accountBalanceHistoryToStartOfRange?.length) {
        return accountBalanceHistoryToStartOfRange[accountBalanceHistoryToStartOfRange.length - 1];
    }
    // fallback to the oldest if nothing is found
    const oldestAccountBalanceMovement = await getOldestAccountBalanceMovement(account);
    return oldestAccountBalanceMovement;
};

const getMinutesBackToStartOfRange = async (
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

const getFiatRatesForSelectedTimeFrame = async (
    timeFrameItem: Required<LineGraphTimeFrameConfiguration>,
    startOfRangeDate: Date,
    endOfRangeDate: Date,
) => {
    const { stepInMinutes } = timeFrameItem;

    const datesInRange = eachMinuteOfInterval(
        {
            start: startOfRangeDate.getTime(),
            end: endOfRangeDate.getTime(),
        },
        {
            step: stepInMinutes,
        },
    );
    const datesInRangeUnixTime = datesInRange.map(date => getBlockbookSafeTime(getUnixTime(date)));

    // FIXME mobile app currently supports only btc so it is hardcoded for now
    const fiatRatesForDatesInRange = await getFiatRatesForTimestamps(
        { symbol: 'btc' },
        datesInRangeUnixTime,
    ).then(res =>
        (res?.tickers || []).map(({ ts, rates }) => ({
            time: ts,
            rates,
        })),
    );
    return fiatRatesForDatesInRange;
};

const prepareAllTimeFrameRatesForGraphPoints = (
    accountBalanceAtStartOfRange: LineGraphTimeFrameItemAccountBalance,
    fiatRatesForTimeFrame: LineGraphTimeFrameItemAccountBalance[],
    accountsBalanceHistoryInRange: LineGraphTimeFrameItemAccountBalance[],
    fiatCurrency: FiatCurrencyCode,
) => {
    const fiatRatesInTime: LineGraphTimeFrameItemAccountBalance[] = [
        ...accountsBalanceHistoryInRange.map(balanceHistoryInRange => ({
            ...balanceHistoryInRange,
            fiatCurrencyRate: balanceHistoryInRange.rates[fiatCurrency],
        })),
        ...fiatRatesForTimeFrame.map(timeInRange => ({
            ...timeInRange,
            balance: undefined,
            fiatCurrencyRate: timeInRange.rates[fiatCurrency],
        })),
    ];

    fiatRatesInTime.unshift({
        ...accountBalanceAtStartOfRange,
        fiatCurrencyRate: accountBalanceAtStartOfRange.rates[fiatCurrency],
    });

    const fiatRatesSortedByTimeAsc = sortTimeFrameItemsByTimeAsc(fiatRatesInTime);
    // account balance at the beginning of time frame has to be the first array item
    const timeFrameItemsWithAllBalances: LineGraphTimeFrameItemAccountBalance[] = [];

    // fill missing balances for time frame items (as graph points).
    fiatRatesSortedByTimeAsc.forEach(rate => {
        const { balance } = rate;
        if (!balance) {
            const previousTimeFrameItemBalance =
                timeFrameItemsWithAllBalances[timeFrameItemsWithAllBalances.length - 1].balance;
            timeFrameItemsWithAllBalances.push({
                ...rate,
                balance: previousTimeFrameItemBalance,
            });
        } else {
            timeFrameItemsWithAllBalances.push(rate);
        }
    });

    // merge balances for the same timestamps (when we want to show different accounts together)
    const timeFrameItemsMap = new Map<number, LineGraphTimeFrameItemAccountBalance>();
    timeFrameItemsWithAllBalances.forEach(timeFrameItemBalance => {
        const { time, balance } = timeFrameItemBalance;
        const existingTimeFrameItem = timeFrameItemsMap.get(time);
        if (existingTimeFrameItem) {
            timeFrameItemsMap.set(time, {
                ...existingTimeFrameItem,
                balance: existingTimeFrameItem.balance! + balance!, // balances are already set before
            });
        } else {
            timeFrameItemsMap.set(time, timeFrameItemBalance);
        }
    });

    const uniqueTimeFrameItemsWithAllBalances = Array.from(timeFrameItemsMap.values());

    // prepare graph points
    return sortTimeFrameItemsByTimeAsc(uniqueTimeFrameItemsWithAllBalances).map(timestamp => {
        const value = Number(timestamp.balance) * Number(timestamp.fiatCurrencyRate);
        return {
            date: new Date(timestamp.time * 1000),
            value,
        };
    });
};

const getTimeFrameData = async (timeFrame: LineGraphTimeFrameValues, accounts: Account[]) => {
    const endOfRangeDate = new Date();

    const minutesBackToStartOfRange = await getMinutesBackToStartOfRange(accounts, timeFrame);
    const timeFrameConfiguration = getTimeFrameConfiguration(
        timeFrame,
        endOfRangeDate,
        minutesBackToStartOfRange,
    );
    const startOfRangeDate = subMinutes(endOfRangeDate, timeFrameConfiguration.valueBackInMinutes);

    const fiatRatesForTimeFrame = await getFiatRatesForSelectedTimeFrame(
        timeFrameConfiguration,
        startOfRangeDate,
        endOfRangeDate,
    );

    return {
        startOfRangeDate,
        endOfRangeDate,
        timeFrameConfiguration,
        fiatRatesForTimeFrame,
    };
};

export const getSingleAccountGraphPointsThunk = createThunk(
    `${actionPrefix}/getSingleAccountGraphPointsThunk`,
    async (
        { accountKey, fiatCurrency, timeFrame }: GetGraphPointsForSingleAccountThunk,
        { getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (account) {
            const {
                startOfRangeDate,
                endOfRangeDate,
                timeFrameConfiguration,
                fiatRatesForTimeFrame,
            } = await getTimeFrameData(timeFrame, [account]);

            const accountBalanceAtStartOfRange = await getAccountBalanceAtStartOfRange(
                account,
                startOfRangeDate,
            );

            const accountsBalanceHistoryInRange = await fetchAccountBalanceHistory(account, {
                from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
                to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
                groupBy: timeFrameConfiguration.stepInMinutes * 60,
            });

            const graphPoints = prepareAllTimeFrameRatesForGraphPoints(
                accountBalanceAtStartOfRange,
                fiatRatesForTimeFrame,
                accountsBalanceHistoryInRange,
                fiatCurrency,
            );

            return graphPoints;
        }

        // TODO handle graph error with thunk lifecycle error?
    },
);

export const getAllAccountsGraphPointsThunk = createThunk(
    `${actionPrefix}/getAllAccountsGraphPointsThunk`,
    async (
        { section, fiatCurrency, timeFrame }: GetGraphPointsForAccountsThunkPayload,
        { getState },
    ) => {
        // FIXME mobile app currently supports only btc so it is hardcoded for now
        const accounts = selectAccountsByNetworkSymbols(getState(), ['btc']);

        if (accounts.length) {
            const {
                startOfRangeDate,
                endOfRangeDate,
                timeFrameConfiguration,
                fiatRatesForTimeFrame,
            } = await getTimeFrameData(timeFrame, accounts);

            const allAccountsBalanceRatesAtStartOfRangePromises = accounts.map(account =>
                getAccountBalanceAtStartOfRange(account, startOfRangeDate),
            );
            const allAccountsBalanceRatesAtStartOfRange = await Promise.all(
                allAccountsBalanceRatesAtStartOfRangePromises,
            );
            // get oldest from this array
            const oldestAccountBalanceRatesAtStartOfRange = sortTimeFrameItemsByTimeAsc(
                allAccountsBalanceRatesAtStartOfRange,
            );

            const accountsBalanceHistoryInRangePromises = accounts.map(account =>
                fetchAccountBalanceHistory(account, {
                    from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
                    to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
                    groupBy: timeFrameConfiguration.stepInMinutes * 60,
                }),
            );
            const accountsBalanceHistoryInRange = await Promise.all(
                accountsBalanceHistoryInRangePromises,
            );

            if (oldestAccountBalanceRatesAtStartOfRange) {
                const graphPoints = prepareAllTimeFrameRatesForGraphPoints(
                    oldestAccountBalanceRatesAtStartOfRange[0],
                    fiatRatesForTimeFrame,
                    accountsBalanceHistoryInRange.flat(),
                    fiatCurrency,
                );

                return {
                    section,
                    graphPoints,
                };
            }
        }
        // TODO handle graph error with thunk lifecycle error?
    },
);
