import { useCallback } from 'react';
import { Dimensions } from 'react-native';

import { TradingCountryOption } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useCountryFilteredData } from '../../../hooks/general/useCountryFilteredData';
import { SearchableSheetHeader } from '../SearchableSheetHeader';
import { CountryListEmptyComponent } from './CountryListEmptyComponent';
import { COUNTRY_LIST_ITEM_HEIGHT, CountryListItem } from './CountryListItem';

export type CountrySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onCountrySelect: (symbol: TradingCountryOption) => void;
    selectedCountryId?: string;
};

const keyExtractor = (item: TradingCountryOption) => item.value;

export const CountrySheet = ({
    isVisible,
    onClose,
    onCountrySelect,
    selectedCountryId,
}: CountrySheetProps) => {
    const { filteredData, filterValue, setFilterValue } = useCountryFilteredData();
    const { translate } = useTranslate();

    // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
    const renderHandle = useCallback(
        () => (
            <SearchableSheetHeader
                onClose={onClose}
                title={<Translation id="moduleTrading.countrySheet.title" />}
                onFilterChange={setFilterValue}
                searchInputPlaceholder={translate(
                    'moduleTrading.countrySheet.searchInputPlaceholder',
                )}
            />
        ),
        [onClose, setFilterValue, translate],
    );

    const onCountrySelectCallback = (country: TradingCountryOption) => {
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
            estimatedItemSize={COUNTRY_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            flashListKey={flashListKey}
            extraData={selectedCountryId}
        />
    );
};
