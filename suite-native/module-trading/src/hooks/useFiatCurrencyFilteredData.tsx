import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectBuySupportedFiatCurrenciesList } from '../selectors/buySelectors';
import { FiatCurrencyItem } from '../types';
import { useListDataFilter } from './useListDataFilter';

const filterCallback = ({ label, value }: FiatCurrencyItem, filterValue: string): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useFiatCurrencyFilteredData = () => {
    const supportedCurrencies = useSelector(selectBuySupportedFiatCurrenciesList);
    const { filteredData: data, setFilterValue } = useListDataFilter(
        supportedCurrencies,
        filterCallback,
    );

    const filteredData = useMemo(
        () => [
            {
                key: 'fiat_currency',
                label: '' as ReactNode,
                data,
                sectionData: undefined,
            },
        ],
        [data],
    );

    return {
        filteredData,
        setFilterValue,
    };
};
