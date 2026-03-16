import { memo, useCallback } from 'react';
import { Dimensions, Keyboard } from 'react-native';

import { type TradingCountryOption, useCountryFilteredData } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { SearchableSheetHeader } from '@suite-native/trading-atoms';

import { CountryListEmptyComponent } from './CountryListEmptyComponent';
import { CountryListItem } from './CountryListItem';

export type CountrySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onCountrySelect: (symbol: TradingCountryOption) => void;
    selectedCountryId?: string;
    testID: string;
};

const keyExtractor = (item: TradingCountryOption) => item.value;

export const CountrySheet = memo(
    ({ isVisible, onClose, onCountrySelect, selectedCountryId, testID }: CountrySheetProps) => {
        const { filteredData, filterValue, setFilterValue } = useCountryFilteredData();
        const { translate } = useTranslate();

        const searchInputTestId = testID ? testID + '/search-input' : undefined;
        const bottomSheetTestId = testID ? testID + '/bottom-sheet' : undefined;

        // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
        const renderHandle = useCallback(
            () => (
                <SearchableSheetHeader
                    onClose={onClose}
                    title={<Translation id="tradingResidence.countrySheet.title" />}
                    onFilterChange={setFilterValue}
                    searchInputTestId={searchInputTestId}
                    searchInputPlaceholder={translate(
                        'tradingResidence.countrySheet.searchInputPlaceholder',
                    )}
                />
            ),
            [onClose, setFilterValue, translate, searchInputTestId],
        );

        const onCountrySelectCallback = (country: TradingCountryOption) => {
            Keyboard.dismiss();
            onCountrySelect(country);
            onClose();
        };

        const listHeight = Dimensions.get('window').height * 0.9;
        // re-mount FLashList component when filterValue changes (resets scroll position)
        const flashListKey = 'countries_list-' + filterValue;

        return (
            <BottomSheetFlashList<TradingCountryOption>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={<CountryListEmptyComponent />}
                handleComponent={renderHandle}
                renderItem={({ item }) => (
                    <CountryListItem
                        {...item}
                        onPress={() => onCountrySelectCallback(item)}
                        isSelected={item.value === selectedCountryId}
                    />
                )}
                data={filteredData}
                estimatedListHeight={listHeight}
                keyExtractor={keyExtractor}
                keyboardShouldPersistTaps="handled"
                flashListKey={flashListKey}
                extraData={selectedCountryId}
                testID={bottomSheetTestId}
            />
        );
    },
);
