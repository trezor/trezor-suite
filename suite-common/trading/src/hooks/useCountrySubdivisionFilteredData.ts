import { useMemo } from 'react';

import { normalizeForSearch } from '@suite-common/suite-utils';

import type { TradingCountrySubdivisionOption } from '../types';
import { useListDataFilter } from './useListDataFilter';
import { getCountrySubdivisions, isCountryCode } from '../utils/countryUtils';

const toSubdivisionOptions = (
    subdivisions: ReadonlyArray<{ code: string; name: string }>,
): TradingCountrySubdivisionOption[] =>
    subdivisions.map(s => ({ value: s.code, label: s.name, name: s.name }));

const filterCallback = (
    { label, value, name }: TradingCountrySubdivisionOption,
    filterValue: string,
): boolean => {
    const normalizedFilterValue = normalizeForSearch(filterValue);

    return (
        normalizeForSearch(label).includes(normalizedFilterValue) ||
        normalizeForSearch(name).includes(normalizedFilterValue) ||
        normalizeForSearch(value).includes(normalizedFilterValue)
    );
};

const sortCallback = (
    a: TradingCountrySubdivisionOption,
    b: TradingCountrySubdivisionOption,
    filterValue: string,
): number => {
    const query = normalizeForSearch(filterValue);
    if (!query) return a.name.localeCompare(b.name);

    const getWeight = (item: TradingCountrySubdivisionOption): number => {
        const name = normalizeForSearch(item.name);
        const value = normalizeForSearch(item.value);

        if (name === query) return 0; // Exact match on name
        if (value === query) return 1; // Exact match on value (code)
        if (name.startsWith(query)) return 2; // Starts with match on name

        return 3; // Other matches
    };

    const weightA = getWeight(a);
    const weightB = getWeight(b);

    if (weightA !== weightB) return weightA - weightB;

    return a.name.localeCompare(b.name);
};

/**
 * Filtered and sorted list of country subdivisions for a given country.
 * Returns empty data when countryCode is missing or the country has no subdivisions.
 */
export const useCountrySubdivisionFilteredData = (countryCode: string | undefined) => {
    const subdivisionOptions = useMemo(() => {
        if (!countryCode || !isCountryCode(countryCode)) return [];

        const subdivisions = getCountrySubdivisions(countryCode);

        return subdivisions ? toSubdivisionOptions(subdivisions) : [];
    }, [countryCode]);

    return useListDataFilter(subdivisionOptions, filterCallback, sortCallback);
};
