import { TradingCountryOption, nonSanctionedRegional } from '@suite-common/trading';
import { useListDataFilter } from '@suite-native/trading-atoms';

const filterCallback = (
    { label, value, codeAlpha3 }: TradingCountryOption,
    filterValue: string,
): boolean => {
    const lowerCaseFilterValue = filterValue.toLowerCase();

    return (
        label.toLowerCase().includes(lowerCaseFilterValue) ||
        codeAlpha3.toLowerCase().includes(lowerCaseFilterValue) ||
        value.toLowerCase().includes(lowerCaseFilterValue)
    );
};

const sortCallback = (
    a: TradingCountryOption,
    b: TradingCountryOption,
    filterValue: string,
): number => {
    const lowerCaseFilterValue = filterValue.toLowerCase();

    if (filterValue) {
        // exact match on name
        if (a.name.toLowerCase() === lowerCaseFilterValue) {
            return -1;
        }
        if (b.name.toLowerCase() === lowerCaseFilterValue) {
            return 1;
        }
        // exact match on value
        if (a.value.toLowerCase() === lowerCaseFilterValue) {
            return -1;
        }
        if (b.value.toLowerCase() === lowerCaseFilterValue) {
            return 1;
        }
        // exact match on codeAlpha3
        if (a.codeAlpha3.toLowerCase() === lowerCaseFilterValue) {
            return -1;
        }
        if (b.codeAlpha3.toLowerCase() === lowerCaseFilterValue) {
            return 1;
        }
        // starts with match on name
        if (
            a.name.toLowerCase().startsWith(lowerCaseFilterValue) &&
            !b.name.toLowerCase().startsWith(lowerCaseFilterValue)
        ) {
            return -1;
        }
        if (
            b.name.toLowerCase().startsWith(lowerCaseFilterValue) &&
            !a.name.toLowerCase().startsWith(lowerCaseFilterValue)
        ) {
            return 1;
        }
    }

    return a.name.localeCompare(b.name);
};

export const useCountryFilteredData = () =>
    useListDataFilter(nonSanctionedRegional.countriesOptions, filterCallback, sortCallback);
