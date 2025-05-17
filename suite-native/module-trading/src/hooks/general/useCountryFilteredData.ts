import { regional } from '@suite-common/trading';

import { useListDataFilter } from './useListDataFilter';

const filterCallback = (
    { label, value }: { label: string; value: string },
    filterValue: string,
): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useCountryFilteredData = () =>
    useListDataFilter(regional.countriesOptions, filterCallback);
