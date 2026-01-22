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
        let data = [...rawData];

        if (filterValue?.length > 0) {
            data = rawData.filter(item => filterCallback(item, filterValue));
        }

        if (sortCallback) {
            data.sort((a, b) => sortCallback(a, b, filterValue));
        }

        return data;
    }, [rawData, filterValue, filterCallback, sortCallback]);

    return { filteredData, filterValue, setFilterValue };
};
