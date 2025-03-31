import { useMemo, useState } from 'react';

export const useListDataFilter = <T>(
    rawData: T[],
    filterCallback: (item: T, filterValue: string) => boolean,
): {
    filteredData: T[];
    setFilterValue: (value: string) => void;
} => {
    const [filterValue, setFilterValue] = useState('');

    const filteredData = useMemo(() => {
        if (filterValue?.length > 0) {
            return rawData.filter(item => filterCallback(item, filterValue));
        }

        return rawData;
    }, [rawData, filterValue, filterCallback]);

    return { filteredData, setFilterValue };
};
