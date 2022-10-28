import { differenceInMinutes, addSeconds } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { selectAccountsByNetworkSymbols, selectAccountByKey } from '@suite-common/wallet-core';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { LineGraphTimeFrameItemAccountBalance, LineGraphTimeFrameValues } from './types';
import {
    getLineGraphPoints,
    getDifferentNetworkSymbolAccounts,
    getStartItemOfTimeFrame,
    mergeAndSortTimeFrameItems,
    getFirstAccountBalanceMovement,
    getTimeFrameData,
    fetchAccountBalanceHistoryWithBalanceBefore,
    getFiatRatesForNetworkInTimeFrame,
    getTimeFrameIntervalsWithSummaryBalances,
} from './graphUtils';
import { accountNotFoundError, actionPrefix, networkAccountsNotFoundError } from './constants';

type GetGraphPointsForAccountsThunkPayload = {
    fiatCurrency: FiatCurrencyCode;
    timeFrame: LineGraphTimeFrameValues;
    networkSymbols: NetworkSymbol[];
};

type GetGraphPointsForSingleAccountThunk = {
    accountKey: string;
    fiatCurrency: FiatCurrencyCode;
    timeFrame: LineGraphTimeFrameValues;
};

export const getTimeFrameDataForSingleAccount = (
    endOfTimeFrameDate: Date,
    timeFrame: LineGraphTimeFrameValues,
    firstAccountBalanceMovement: LineGraphTimeFrameItemAccountBalance,
) => {
    // get the first account balance movement
    const firstAccountBalanceMovementTimestamp = firstAccountBalanceMovement
        ? firstAccountBalanceMovement.time
        : endOfTimeFrameDate.getTime();

    const minutesBackToOldestAccountBalanceMovements = differenceInMinutes(
        endOfTimeFrameDate,
        new Date(firstAccountBalanceMovementTimestamp * 1000),
    );

    const timeFrameData = getTimeFrameData(
        timeFrame,
        minutesBackToOldestAccountBalanceMovements,
        endOfTimeFrameDate,
    );
    const { startOfTimeFrameDate, timestampDatesInTimeFrame } = timeFrameData;

    return {
        startOfTimeFrameDate,
        timestampDatesInTimeFrame,
    };
};

const getSingleAccountTimeFrameItems = async (
    account: Account,
    fiatCurrency: FiatCurrencyCode,
    timeFrame: LineGraphTimeFrameValues,
) => {
    const endOfTimeFrameDate = new Date();
    // get the first date with some account balance movement for calculating the time frame
    const firstAccountBalanceMovement = await getFirstAccountBalanceMovement(account);

    if (!firstAccountBalanceMovement) {
        return [];
    }

    const { startOfTimeFrameDate, timestampDatesInTimeFrame } = getTimeFrameDataForSingleAccount(
        endOfTimeFrameDate,
        timeFrame,
        firstAccountBalanceMovement,
    );

    const timeFrameRates = await getFiatRatesForNetworkInTimeFrame(
        timestampDatesInTimeFrame,
        account,
    );

    const startOfTimeFrameItemWithBalance = await getStartItemOfTimeFrame(
        account,
        startOfTimeFrameDate,
    );

    const balanceMovementsInTimeFrameRates = await fetchAccountBalanceHistoryWithBalanceBefore(
        account,
        startOfTimeFrameItemWithBalance,
        addSeconds(startOfTimeFrameDate, 1),
        endOfTimeFrameDate,
    );

    const allTimeFrameRates = mergeAndSortTimeFrameItems(
        startOfTimeFrameItemWithBalance,
        startOfTimeFrameDate,
        timeFrameRates,
        balanceMovementsInTimeFrameRates,
        fiatCurrency,
        account,
    );

    return allTimeFrameRates;
};

export const getSingleAccountGraphPointsThunk = createThunk(
    `${actionPrefix}/getSingleAccountGraphPointsThunk`,
    async (
        { accountKey, fiatCurrency, timeFrame }: GetGraphPointsForSingleAccountThunk,
        { getState },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (account) {
            // fill missing balances for time frame items (as graph points).
            const allTimeFrameRates = await getSingleAccountTimeFrameItems(
                account,
                fiatCurrency,
                timeFrame,
            );

            // fill missing balances for time frame items (as graph points).
            const allTimeFrameRatesWithBalances = allTimeFrameRates.map((rate, index) => {
                if (index > 0) {
                    rate.balance = allTimeFrameRates[index - 1].balance;
                }
                return rate;
            });

            const points = getLineGraphPoints(allTimeFrameRatesWithBalances);
            return points;
        }
        throw new Error(accountNotFoundError);
    },
);

export const getAllAccountsGraphPointsThunk = createThunk(
    `${actionPrefix}/getAllAccountsGraphPointsThunk`,
    async (
        { fiatCurrency, timeFrame, networkSymbols }: GetGraphPointsForAccountsThunkPayload,
        { getState },
    ) => {
        const accounts = selectAccountsByNetworkSymbols(getState(), networkSymbols);

        if (accounts.length) {
            const differentNetworkSymbolAccountsMap = getDifferentNetworkSymbolAccounts(accounts);

            const accountTimeFrameItemsPromises: Array<
                Promise<LineGraphTimeFrameItemAccountBalance[]>
            > = [];
            Object.values(differentNetworkSymbolAccountsMap).forEach(networkSymbolAccounts => {
                networkSymbolAccounts.forEach(account => {
                    accountTimeFrameItemsPromises.push(
                        getSingleAccountTimeFrameItems(account, fiatCurrency, timeFrame),
                    );
                });
            });

            const accountTimeFrameItems = await Promise.all(accountTimeFrameItemsPromises);
            return getTimeFrameIntervalsWithSummaryBalances(accountTimeFrameItems);
        }
        throw new Error(networkAccountsNotFoundError);
    },
);
