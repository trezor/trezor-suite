import { TradingCountryOption, nonSanctionedRegional } from '@suite-common/trading';

import { useListDataFilter } from './useListDataFilter';

const filterCallback = ({ label, value }: TradingCountryOption, filterValue: string): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useCountryFilteredData = () =>
    useListDataFilter(nonSanctionedRegional.countriesOptions, filterCallback);
