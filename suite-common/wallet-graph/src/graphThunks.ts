import { differenceInMinutes, eachMinuteOfInterval, getUnixTime, subMinutes } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectAccountsByNetworkSymbols, selectAccountByKey } from '@suite-common/wallet-core';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { AccountBalanceHistory } from '@trezor/blockchain-link';

import {
    EnhancedAccountBalanceHistory,
    FiatRatesForTimeFrame,
    LineGraphTimeFrameValues,
    LineGraphTimeFrameConfiguration,
    GraphSection,
} from './types';
import {
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
    getLineGraphAllTimeStepInMinutes,
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

const sortAccountBalanceHistoryByTimeAsc = (accountBalanceMovements: AccountBalanceHistory[]) =>
    accountBalanceMovements.sort((a, b) => a.time - b.time);

const getSuccessAccountBalanceMovements = (
    accountBalanceMovements: Array<AccountBalanceHistory | undefined>,
) => (accountBalanceMovements ? accountBalanceMovements.filter(movement => !!movement?.time) : []);

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
        const sortedPayload = sortAccountBalanceHistoryByTimeAsc(response.payload);
        const responseWithRates = await ensureHistoryRates(account.symbol, sortedPayload);
        const enhancedResponse = enhanceBlockchainAccountHistory(responseWithRates, account.symbol);
        const successAccountBalanceMovements = getSuccessAccountBalanceMovements(enhancedResponse);
        return successAccountBalanceMovements as EnhancedAccountBalanceHistory[];
    }
};

const getOldestAccountBalanceMovement = async (account: Account) => {
    const accountBalanceHistory = await fetchAccountBalanceHistory(account, {
        groupBy: 3600 * 24, // day
    });
    return accountBalanceHistory?.length ? accountBalanceHistory[0] : null;
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
 * to have balance history as a continuous line.
 * @param account
 * @param startOfRangeDate
 */
const getAccountBalanceAtStartOfRange = async (
    account: Account,
    startOfRangeDate: Date,
): Promise<EnhancedAccountBalanceHistory | undefined> => {
    const accountBalanceHistoryToStartOfRange = await fetchAccountBalanceHistory(account, {
        to: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
        groupBy: 3600, // day
    });
    if (accountBalanceHistoryToStartOfRange?.length) {
        return accountBalanceHistoryToStartOfRange[
            accountBalanceHistoryToStartOfRange.length - 1
        ] as EnhancedAccountBalanceHistory;
    }
    const oldestAccountBalanceMovement = await getOldestAccountBalanceMovement(account);
    return oldestAccountBalanceMovement as EnhancedAccountBalanceHistory;
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

const getTimeFrameConfiguration = (
    timeFrame: LineGraphTimeFrameValues,
    endOfRangeDate: Date,
    minutesBackToStartOfRange: number,
) => {
    const stepInMinutes =
        timeSwitchItems[timeFrame]?.stepInMinutes ??
        getLineGraphAllTimeStepInMinutes(endOfRangeDate, minutesBackToStartOfRange);

    return {
        ...timeSwitchItems[timeFrame],
        valueBackInMinutes: minutesBackToStartOfRange,
        stepInMinutes,
    };
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
    return fiatRatesForDatesInRange as FiatRatesForTimeFrame;
};

const prepareAllTimeFrameRatesForGraphPoints = (
    accountBalanceRatesAtStartOfRange: EnhancedAccountBalanceHistory,
    fiatRatesForTimeFrame: FiatRatesForTimeFrame,
    accountsBalanceHistoryInRange: EnhancedAccountBalanceHistory[],
    fiatCurrency: FiatCurrencyCode,
) => {
    const fiatRatesInTime = [
        ...accountsBalanceHistoryInRange.map(balanceHistoryInRange => ({
            time: balanceHistoryInRange.time,
            balance: balanceHistoryInRange.balance,
            fiatCurrencyRate: balanceHistoryInRange.rates[fiatCurrency],
        })),
        ...fiatRatesForTimeFrame.map(timeInRange => ({
            time: timeInRange.time,
            balance: null,
            fiatCurrencyRate: timeInRange.rates[fiatCurrency],
        })),
    ];

    const fiatRatesSortedByTimeAsc = fiatRatesInTime.sort((a, b) => a.time - b.time);
    // account balance at the beginning of time frame has to be the first array item
    const newArrayWithAllBalancesFilled = [
        {
            time: accountBalanceRatesAtStartOfRange.time,
            balance: accountBalanceRatesAtStartOfRange.balance,
            fiatCurrencyRate: accountBalanceRatesAtStartOfRange.rates[fiatCurrency],
        },
    ];

    fiatRatesSortedByTimeAsc.forEach(rate => {
        const { balance } = rate;
        if (!balance) {
            const previousTimeFrameItemBalance =
                newArrayWithAllBalancesFilled[newArrayWithAllBalancesFilled.length - 1].balance;
            newArrayWithAllBalancesFilled.push({
                ...rate,
                balance: previousTimeFrameItemBalance,
            });
        } else {
            newArrayWithAllBalancesFilled.push(rate);
        }
    });

    // prepare graph points
    return newArrayWithAllBalancesFilled.map(timestamp => {
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

export const getGraphPointsForSingleAccountThunk = createThunk(
    `${actionPrefix}/getGraphPointsForSingleAccountThunk`,
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

            const accountBalanceRatesAtStartOfRange = await getAccountBalanceAtStartOfRange(
                account,
                startOfRangeDate,
            );

            const accountsBalanceHistoryInRange = await fetchAccountBalanceHistory(account, {
                from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
                to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
                groupBy: timeFrameConfiguration.stepInMinutes * 60,
            });

            const graphPoints = prepareAllTimeFrameRatesForGraphPoints(
                accountBalanceRatesAtStartOfRange,
                fiatRatesForTimeFrame,
                accountsBalanceHistoryInRange,
                fiatCurrency,
            );

            return graphPoints;
        }

        // TODO handle graph error with thunk lifecycle error?
    },
);

export const getGraphPointsForAccountsThunk = createThunk(
    `${actionPrefix}/getGraphPointsForAccountsThunk`,
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
            const oldestAccountBalanceRatesAtStartOfRange = sortAccountBalanceHistoryByTimeAsc(
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
                // TODO merge the same timestamp balances for different accunts together
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
