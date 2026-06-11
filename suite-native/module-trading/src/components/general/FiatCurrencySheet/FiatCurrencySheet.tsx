import { memo, useCallback } from 'react';

import type { FiatCurrencyCode } from 'invity-api';

import { type BottomSheetFlashListHandleProps, Divider } from '@suite-native/atoms';
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
const ItemSeparator = () => <Divider />;

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

        const renderHandle = useCallback(
            ({ closeSheet }: BottomSheetFlashListHandleProps) => (
                <SearchableSheetHeader
                    key="fiat_currency"
                    onClose={closeSheet}
                    title={<Translation id="moduleTrading.fiatCurrencySheet.title" />}
                    onFilterChange={setFilterValue}
                    searchInputPlaceholder={translate(
                        'moduleTrading.fiatCurrencySheet.searchInputPlaceholder',
                    )}
                    searchInputTestId={searchInputTestId}
                />
            ),
            [setFilterValue, translate, searchInputTestId],
        );

        // re-mount FLashList component when filterValue changes (resets scroll position)
        const flashListKey = 'fiat_currencies_list-' + filterValue;

        return (
            <BottomSheetSectionList<FiatCurrencyItem>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={<FiatCurrencyListEmptyComponent />}
                handleComponent={renderHandle}
                renderItem={({ value, ...rest }, _config, { closeSheet }) => (
                    <FiatCurrencyListItem
                        {...rest}
                        value={value}
                        onPress={() => {
                            onFiatSelect(value);
                            closeSheet();
                        }}
                    />
                )}
                data={filteredData}
                keyExtractor={keyExtractor}
                flashListKey={flashListKey}
                ItemSeparatorComponent={ItemSeparator}
                noSingletonSectionHeader
            />
        );
    },
);
