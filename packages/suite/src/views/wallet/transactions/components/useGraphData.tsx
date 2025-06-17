import { useEffect, useState } from 'react';

import { eachDayOfInterval, isSameDay } from 'date-fns';

import { selectLocalCurrency } from '@suite-common/wallet-core';

import {
    MetaData,
    RawDataItem,
} from '../../../../components/suite/graph/TransactionsGraph/newGraph/types';
import {
    calculateMetaData,
    calculateSegments,
} from '../../../../components/suite/graph/TransactionsGraph/newGraph/utils';
import { useSelector } from '../../../../hooks/suite';
import { GraphRange } from '../../../../types/wallet/graph';
import { calculateValues } from './calculateValues';

// @TODO: move somewhere else, CAN'T BE DATE HERE
export const getCurrentRange = (selectedRange: GraphRange) => {
    if (selectedRange.label === 'all') {
        const startDate = new Date(2025, 0, 1).toISOString();
        const endDate = new Date().toISOString();

        return {
            ...selectedRange,
            startDate,
            endDate,
        };
    }

    return selectedRange;
};

export const enhanceBalanceGraphDataForEachStep = (
    startBalance: number,
    currentRange: GraphRange,
    balanceGraphData: RawDataItem[],
) => {
    const interval = eachDayOfInterval({
        start: new Date(currentRange.startDate!), // TODO fix type
        end: new Date(currentRange.endDate!),
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

    return newValues.map(item => ({ ...item, value: item.value + startBalance }));
};

type UseGraphDataProps = {
    selectedRange: GraphRange;
    balanceGraphData: RawDataItem[];
    startBalance: number;
    fiatRates: RawDataItem[];
};

export const useGraphData = ({
    selectedRange,
    balanceGraphData,
    startBalance,
    fiatRates,
}: UseGraphDataProps) => {
    const [graphData, setGraphData] = useState<RawDataItem[]>([]);
    const localCurrency = useSelector(selectLocalCurrency);
    const currentRange = getCurrentRange(selectedRange);
    const [segments, setSegments] = useState<RawDataItem[][]>([]);
    const [verticalSegments, setVerticalSegments] = useState<RawDataItem[][]>([]);
    const [ticks, setTicks] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [metaData, setMetaData] = useState<MetaData>({
        min: null,
        max: null,
        average: null,
    });

    const removeData = () => {
        setVerticalSegments([]);
        setTicks([]);
        setGraphData([]);
        setSegments([]);
    };

    useEffect(() => {
        setIsLoading(true);
        removeData();

        const combinedData = calculateValues({
            fiatRates,
            startBalance,
            currentRange,
            balanceGraphData,
        });

        setGraphData(combinedData);
    }, [selectedRange, currentRange, localCurrency, startBalance, balanceGraphData, fiatRates]);

    useEffect(() => {
        const { newSegments, newVerticalSegments, filteredTicks } = calculateSegments(graphData);

        setSegments(newSegments);
        setVerticalSegments(newVerticalSegments);
        setTicks(filteredTicks);

        setMetaData(calculateMetaData(graphData));
        setIsLoading(false);
    }, [graphData, setSegments, setTicks, setVerticalSegments]);

    return {
        isLoading,
        data: graphData,
        metaData,
        segments,
        verticalSegments,
        ticks,
    };
};
