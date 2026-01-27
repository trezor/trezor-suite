import { useMemo, useState } from 'react';

export const useListDataFilter = <T>(
    rawData: T[],
    filterCallback: (item: T, filterValue: string) => boolean,
    sortCallback?: (a: T, b: T, filterValue: string) => number,
): {
    filteredData: T[];
    filterValue: string;
    setFilterValue: (value: string) => void;
} => {
    const [filterValue, setFilterValue] = useState('');

    const filteredData = useMemo(() => {
        const data =
            filterValue.length > 0
                ? rawData.filter(item => filterCallback(item, filterValue))
                : [...rawData];

        if (sortCallback) {
            data.sort((a, b) => sortCallback(a, b, filterValue));
        }

        return data;
    }, [rawData, filterValue, filterCallback, sortCallback]);

    return { filteredData, filterValue, setFilterValue };
};
