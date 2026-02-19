import { normalizeForSearch } from '@suite-common/suite-utils';

import { nonSanctionedRegional } from '../regional';
import { TradingCountryOption } from '../types';
import { useListDataFilter } from './useListDataFilter';

const filterCallback = (
    { label, value, codeAlpha3 }: TradingCountryOption,
    filterValue: string,
): boolean => {
    const normalizedFilterValue = normalizeForSearch(filterValue);

    return (
        normalizeForSearch(label).includes(normalizedFilterValue) ||
        normalizeForSearch(codeAlpha3).includes(normalizedFilterValue) ||
        normalizeForSearch(value).includes(normalizedFilterValue)
    );
};

const sortCallback = (
    a: TradingCountryOption,
    b: TradingCountryOption,
    filterValue: string,
): number => {
    const query = normalizeForSearch(filterValue);
    if (!query) return a.name.localeCompare(b.name);

    const getWeight = (item: TradingCountryOption): number => {
        const name = normalizeForSearch(item.name);
        const value = normalizeForSearch(item.value);
        const code = normalizeForSearch(item.codeAlpha3);

        if (name === query) return 0; // Exact match on name
        if (value === query) return 1; // Exact match on value
        if (code === query) return 2; // Exact match on code (Alpha3)
        if (name.startsWith(query)) return 3; // Starts with match on name

        return 4; // Other matches
    };

    const weightA = getWeight(a);
    const weightB = getWeight(b);

    // Sorting based on priority of match
    if (weightA !== weightB) {
        return weightA - weightB;
    }

    // If they have the same priority (e.g., both are "just" a start of a word),
    return a.name.localeCompare(b.name);
};

export const useCountryFilteredData = () =>
    useListDataFilter(nonSanctionedRegional.countriesOptions, filterCallback, sortCallback);
