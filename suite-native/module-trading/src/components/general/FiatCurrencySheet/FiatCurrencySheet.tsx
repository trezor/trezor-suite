import { memo, useCallback } from 'react';

import type { FiatCurrencyCode } from 'invity-api';

import { Translation, useTranslate } from '@suite-native/intl';
import { BottomSheetSectionList, SearchableSheetHeader } from '@suite-native/trading-atoms';
import { type FiatCurrencyItem } from '@suite-native/trading-types';

import { FiatCurrencyListEmptyComponent } from './FiatCurrencyListEmptyComponent';
import { FiatCurrencyListItem } from './FiatCurrencyListItem';
import { useFiatCurrencyFilteredData } from '../../../hooks/general/useFiatCurrencyFilteredData';

export type FiatCurrencySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onFiatSelect: (currency: FiatCurrencyCode) => void;
    supportedFiatCurrencies: FiatCurrencyItem[];
    searchInputTestId?: string;
};

const keyExtractor = (item: FiatCurrencyItem) => item.value;

export const FiatCurrencySheet = memo(
    ({
        isVisible,
        onClose,
        onFiatSelect,
        supportedFiatCurrencies,
        searchInputTestId,
    }: FiatCurrencySheetProps) => {
        const { filteredData, filterValue, setFilterValue } =
            useFiatCurrencyFilteredData(supportedFiatCurrencies);
        const { translate } = useTranslate();

        // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
        const renderHandle = useCallback(
            () => (
                <SearchableSheetHeader
                    key="fiat_currency"
                    onClose={onClose}
                    title={<Translation id="moduleTrading.fiatCurrencySheet.title" />}
                    onFilterChange={setFilterValue}
                    searchInputPlaceholder={translate(
                        'moduleTrading.fiatCurrencySheet.searchInputPlaceholder',
                    )}
                    searchInputTestId={searchInputTestId}
                />
            ),
            [onClose, setFilterValue, translate, searchInputTestId],
        );

        const onFiatSelectCallback = (currency: FiatCurrencyCode) => {
            onFiatSelect(currency);
            onClose();
        };

        // re-mount FLashList component when filterValue changes (resets scroll position)
        const flashListKey = 'fiat_currencies_list-' + filterValue;

        return (
            <BottomSheetSectionList<FiatCurrencyItem>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={<FiatCurrencyListEmptyComponent />}
                handleComponent={renderHandle}
                renderItem={({ value, ...rest }) => (
                    <FiatCurrencyListItem
                        value={value}
                        {...rest}
                        onPress={() => onFiatSelectCallback(value)}
                    />
                )}
                data={filteredData}
                keyExtractor={keyExtractor}
                flashListKey={flashListKey}
                noSingletonSectionHeader
            />
        );
    },
);
