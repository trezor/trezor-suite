import { useEffect, useState } from 'react';

import { eachDayOfInterval, getUnixTime, isAfter, isBefore, isSameDay } from 'date-fns';

import { selectLocalCurrency } from '@suite-common/wallet-core';

import { demoData } from '../../../../components/suite/graph/TransactionsGraph/newGraph/data';
import {
    ApiData,
    RawDataItem,
} from '../../../../components/suite/graph/TransactionsGraph/newGraph/types';
import { sanitizeCoinData } from '../../../../components/suite/graph/TransactionsGraph/newGraph/utils';
import { useSelector } from '../../../../hooks/suite';
import { GraphRange } from '../../../../types/wallet/graph';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';

const getCurrentRange = (selectedRange: GraphRange) => {
    if (selectedRange.label === 'all') {
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date();

        return {
            ...selectedRange,
            startDate,
            endDate,
        };
    }

    return selectedRange;
};

const fetchMockData = (selectedRange: GraphRange) => {
    const currentRange = getCurrentRange(selectedRange);
    const rawData = sanitizeCoinData(demoData, selectedRange);
    const filteredRawData = rawData.filter(
        item =>
            isBefore(new Date(item.date), currentRange.endDate) &&
            isAfter(new Date(item.date), currentRange.startDate),
    );

    return filteredRawData;
};

const fetchData = async (selectedRange: GraphRange, localCurrency) => {
    const currentRange = getCurrentRange(selectedRange);
    const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
    const toTimestamp = getUnixTime(new Date(currentRange.endDate));
    const response = await fetch(
        `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
    );
    const fetchedData = (await response.json()) as ApiData;

    return sanitizeCoinData(fetchedData, selectedRange);
};

export const enhanceBalanceGraphDataForEachStep = (
    startBalance: number,
    currentRange: {
        startDate: Date;
        endDate: Date;
    },
    balanceGraphData: RawDataItem[],
) => {
    console.log('___', startBalance);
    const interval = eachDayOfInterval({
        start: currentRange.startDate,
        end: currentRange.endDate,
    });

    const newValues = interval.reduce<RawDataItem[]>((acc, intervalDate: Date) => {
        const balanceForThisStep =
            balanceGraphData.find(balanceItem =>
                isSameDay(new Date(balanceItem.date), intervalDate),
            )?.value || 0;

        const dateString = intervalDate.toISOString();
        if (acc.length === 0) {
            return [{ date: dateString, value: 0 }]; // get account value for dateString
        }
        const previousBalance = acc[acc.length - 1].value;

        return [
            ...acc,
            {
                date: dateString,
                value: balanceForThisStep || previousBalance,
            },
        ];
    }, []);

    console.log(
        '___!!',
        newValues.map(item => ({ ...item, value: item.value + startBalance })),
    );

    return newValues.map(item => ({ ...item, value: item.value + startBalance }));
};

type UseGraphDataProps = {
    selectedRange: GraphRange;
    balanceGraphData: RawDataItem[];
    account: Account;
};

const GROUPING_IN_SECONDS = 100000000;

export const useGraphData = ({ selectedRange, balanceGraphData, account }: UseGraphDataProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [fiatRates, setFiatRates] = useState<RawDataItem[]>([]);
    const [graphData, setGraphData] = useState<RawDataItem[]>([]);
    const [startBalance, setStartBalance] = useState<number>(0);
    const localCurrency = useSelector(selectLocalCurrency);
    const currentRange = getCurrentRange(selectedRange);

    const fetchStartBalance = async () => {
        const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: account.symbol,
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            to: currentRange.endDate.getTime(),
            groupBy: 100000000,
            currencies: ['usd'],
        });
        const value =
            ((connectBalanceHistory?.payload?.[0]?.sent || 0) +
                connectBalanceHistory?.payload?.[0]?.received || 0) / GROUPING_IN_SECONDS;

        setStartBalance(value);
    };

    useEffect(() => {
        fetchStartBalance();
        setIsLoading(true);
        // removeData();

        setFiatRates(fetchMockData(selectedRange));
        // setFiatRates(await fetchData(selectedRange,localCurrency).catch(console.error)); // tohle je možná blbě

        const balanceGraphDataForEachStep = enhanceBalanceGraphDataForEachStep(
            startBalance,
            currentRange,
            balanceGraphData,
        );

        const combinedData = fiatRates.map(rate => {
            const balanceValueForThisStep = balanceGraphDataForEachStep.find(balanceItem =>
                isSameDay(new Date(rate.date), new Date(balanceItem.date)),
            );

            return {
                date: rate.date,
                value: balanceValueForThisStep ? balanceValueForThisStep.value : 0,
                fiatValue: balanceValueForThisStep ? rate.value * balanceValueForThisStep.value : 0,
            };
        });
        setGraphData(combinedData);
    }, [selectedRange.startDate, selectedRange.endDate, localCurrency]);

    return { isLoading, graphData };
};
