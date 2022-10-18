import {
    differenceInMinutes,
    eachMinuteOfInterval,
    getUnixTime,
    startOfDay,
    subMinutes,
} from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectAccountsByNetworkSymbols } from '@suite-common/wallet-core';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import {
    EnhancedAccountBalanceHistory,
    FiatRatesForTimeFrame,
    LineGraphTimeFrameValues,
} from './types';
import {
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
    getLineGraphAllTimeStepInMinutes,
} from './graphUtils';
import { timeSwitchItems } from './config';
import { actionPrefix } from './graphActions';
import { AccountBalanceHistory } from '@trezor/blockchain-link';
import { LineGraphTimeFrameItem } from '@suite-common/wallet-types/libDev/src/graph';

const sortAccountBalanceHistoryByTimeAsc = (accountBalanceMovements: AccountBalanceHistory[]) => {
    return accountBalanceMovements.sort((a, b) => {
        return a.time - b.time;
    });
};

const getSuccessAccountBalanceMovements = (
    accountBalanceMovements: Array<AccountBalanceHistory | undefined>,
) => {
    const successAccountMovement = [];
    for (let movement of accountBalanceMovements) {
        if (movement?.time) {
            successAccountMovement.push(movement);
        }
    }
    return successAccountMovement;
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
                const sortedPayload = sortAccountBalanceHistoryByTimeAsc(response.payload);
                const responseWithRates = await ensureHistoryRates(account.symbol, sortedPayload);
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
    const successAccountBalanceMovements = getSuccessAccountBalanceMovements(
        accountBalanceMovements.flat(),
    );
    return successAccountBalanceMovements as EnhancedAccountBalanceHistory[];
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

/**
 * We need to know what is the balance in the beginning of selected graph time frame.
 * @param account
 * @param startOfRangeDate
 */
const getAccountBalanceAtStartOfRange = async (
    account: Account,
    startOfRangeDate: Date,
): Promise<EnhancedAccountBalanceHistory | undefined> => {
    const oldestAccountBalanceMovement = await getOldestAccountBalanceMovement(account);
    if (oldestAccountBalanceMovement?.time) {
        const oldestAccountBalanceMovementTimestamp = oldestAccountBalanceMovement.time;
        const oldestAccountBalanceMovementStartOfDay = startOfDay(
            new Date(oldestAccountBalanceMovementTimestamp * 1000),
        );
        const accountBalanceHistoryToStartOfRange = await fetchAccountsBalanceHistory([account], {
            from: getBlockbookSafeTime(getUnixTime(oldestAccountBalanceMovementStartOfDay)),
            to: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
            groupBy: 3600, // day
        });
        return accountBalanceHistoryToStartOfRange.length
            ? (accountBalanceHistoryToStartOfRange[
                  accountBalanceHistoryToStartOfRange.length - 1
              ] as EnhancedAccountBalanceHistory)
            : (oldestAccountBalanceMovement as EnhancedAccountBalanceHistory);
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

const getTimeFrameItem = async (
    timeFrame: LineGraphTimeFrameValues,
    endOfRangeDate: Date,
    accounts: Account[],
) => {
    const valueBackInMinutes = await getValueBackInMinutes(accounts, timeFrame);
    const stepInMinutes =
        timeSwitchItems[timeFrame]?.stepInMinutes ??
        getLineGraphAllTimeStepInMinutes(endOfRangeDate, valueBackInMinutes);

    return {
        ...timeSwitchItems[timeFrame],
        valueBackInMinutes,
        stepInMinutes,
    };
};

const getFiatRatesForTimeFrame = async (
    timeFrameItem: Required<LineGraphTimeFrameItem>,
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
        (res?.tickers || []).map(({ ts, rates }) => {
            return {
                time: ts,
                rates,
            };
        }),
    );
    return fiatRatesForDatesInRange as FiatRatesForTimeFrame;
};

const prepareAllTimeFrameRatesForGraphPoints = (
    accountBalanceRatesAtStartOfRange: EnhancedAccountBalanceHistory,
    fiatRatesForTimesInRange: FiatRatesForTimeFrame,
    accountsBalanceHistoryInRange: EnhancedAccountBalanceHistory[],
    fiatCurrency: FiatCurrencyCode,
) => {
    const fiatRatesInTime = [
        ...accountsBalanceHistoryInRange.map(balanceHistoryInRange => {
            return {
                time: balanceHistoryInRange.time,
                balance: balanceHistoryInRange.balance,
                fiatCurrencyRate: balanceHistoryInRange.rates[fiatCurrency],
            };
        }),
        ...fiatRatesForTimesInRange.map(timeInRange => {
            return {
                time: timeInRange.time,
                balance: null,
                fiatCurrencyRate: timeInRange.rates[fiatCurrency],
            };
        }),
    ];

    const fiatRatesSortedByTimeAsc = fiatRatesInTime.sort((a, b) => {
        return a.time - b.time;
    });
    // account balance at the beginning of time frame has to be the first array item
    const newArrayWithAllBalancesFilled = [
        {
            time: accountBalanceRatesAtStartOfRange.time,
            balance: accountBalanceRatesAtStartOfRange.balance,
            fiatCurrencyRate: accountBalanceRatesAtStartOfRange.rates[fiatCurrency],
        },
    ];

    for (let rate of fiatRatesSortedByTimeAsc) {
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
    }

    return newArrayWithAllBalancesFilled;
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
            fiatCurrency,
            timeFrame,
        }: {
            section: 'dashboard' | 'account';
            fiatCurrency: FiatCurrencyCode;
            timeFrame: LineGraphTimeFrameValues;
        },
        { getState },
    ) => {
        const endOfRangeDate = new Date();

        // FIXME mobile app currently supports only btc so it is hardcoded for now
        const accounts = selectAccountsByNetworkSymbols(getState(), ['btc']);
        const timeFrameItem = await getTimeFrameItem(timeFrame, endOfRangeDate, accounts);
        const startOfRangeDate = subMinutes(endOfRangeDate, timeFrameItem.valueBackInMinutes);

        // FIXME do not hardcode first account
        const accountBalanceRatesAtStartOfRange = await getAccountBalanceAtStartOfRange(
            accounts[0],
            startOfRangeDate,
        );

        const fiatRatesForTimesInRange = await getFiatRatesForTimeFrame(
            timeFrameItem,
            startOfRangeDate,
            endOfRangeDate,
        );

        // FIXME do not hardcode first account
        const accountsBalanceHistoryInRange = await fetchAccountsBalanceHistory([accounts[0]], {
            from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)),
            to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
            groupBy: timeFrameItem.stepInMinutes * 60,
        });

        if (accountBalanceRatesAtStartOfRange) {
            const timeFrameItemsWithAllBalances = prepareAllTimeFrameRatesForGraphPoints(
                accountBalanceRatesAtStartOfRange,
                fiatRatesForTimesInRange,
                accountsBalanceHistoryInRange,
                fiatCurrency,
            );

            console.log('timeFrameItemsWithAllBalances********: ', timeFrameItemsWithAllBalances);

            const points = timeFrameItemsWithAllBalances.map(timestamp => {
                const value = Number(timestamp.balance) * Number(timestamp.fiatCurrencyRate);
                return {
                    date: new Date(timestamp.time * 1000),
                    value: value,
                };
            });

            console.log('points********: ', points);

            return {
                section,
                points,
            };
        } else {
            // TODO handle graph error with thunk lifecycle error?
        }
    },
);
