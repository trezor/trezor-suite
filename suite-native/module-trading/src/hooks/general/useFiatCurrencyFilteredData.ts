import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useListDataFilter } from './useListDataFilter';
import { selectBuySupportedFiatCurrenciesList } from '../../selectors/buySelectors';
import { FiatCurrencyItem } from '../../types/general';

const filterCallback = ({ label, value }: FiatCurrencyItem, filterValue: string): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useFiatCurrencyFilteredData = () => {
    const supportedCurrencies = useSelector(selectBuySupportedFiatCurrenciesList);
    const {
        filteredData: data,
        filterValue,
        setFilterValue,
    } = useListDataFilter(supportedCurrencies, filterCallback);

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
        filterValue,
        setFilterValue,
    };
};
