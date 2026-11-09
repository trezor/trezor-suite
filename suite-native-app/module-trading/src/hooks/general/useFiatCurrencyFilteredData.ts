import { type ReactNode, useMemo } from 'react';

import { useListDataFilter } from '@suite-common/trading';
import { type FiatCurrencyItem } from '@suite-native/trading-types';

const filterCallback = ({ label, value }: FiatCurrencyItem, filterValue: string): boolean =>
    label.toLowerCase().includes(filterValue.toLowerCase()) ||
    value.toLowerCase().includes(filterValue.toLowerCase());

export const useFiatCurrencyFilteredData = (supportedFiatCurrencies: FiatCurrencyItem[]) => {
    const {
        filteredData: data,
        filterValue,
        setFilterValue,
    } = useListDataFilter(supportedFiatCurrencies, filterCallback);

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
