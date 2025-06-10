import { useEffect, useState } from 'react';

import { getUnixTime, isAfter, isBefore } from 'date-fns';

import { selectLocalCurrency } from '@suite-common/wallet-core';

import { demoData } from '../../../../components/suite/graph/TransactionsGraph/newGraph/data';
import {
    ApiData,
    RawDataItem,
} from '../../../../components/suite/graph/TransactionsGraph/newGraph/types';
import { sanitizeCoinData } from '../../../../components/suite/graph/TransactionsGraph/newGraph/utils';
import { useSelector } from '../../../../hooks/suite';
import { GraphData, GraphRange } from '../../../../types/wallet/graph';

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

export const useGraphData = ({ selectedRange }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [raw, setRaw] = useState<RawDataItem[]>([]);
    const localCurrency = useSelector(selectLocalCurrency);
    const currentRange = getCurrentRange(selectedRange);

    useEffect(() => {
        setIsLoading(true);
        // removeData();

        const fetchMockData = () => {
            const rawData = sanitizeCoinData(demoData, selectedRange);
            const filteredRawData = rawData.filter(
                item =>
                    isBefore(new Date(item.date), currentRange.endDate) &&
                    isAfter(new Date(item.date), currentRange.startDate),
            );
            setRaw(filteredRawData);
        };

        const fetchData = async () => {
            const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
            const toTimestamp = getUnixTime(new Date(currentRange.endDate));

            console.log(
                '___ZZZZZTT',
                `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
            );
            const response = await fetch(
                `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
            );
            const fetchedData = (await response.json()) as ApiData;
            setRaw(sanitizeCoinData(fetchedData, selectedRange));
        };

        fetchMockData();
        // fetchData().catch(console.error);
    }, [selectedRange.startDate, selectedRange.endDate, localCurrency]);

    return { isLoading, graphData: raw };
};
