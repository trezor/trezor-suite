import { useCallback, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

import { regional } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SearchableSheetHeader } from '../SearchableSheetHeader';
import { CountryListEmptyComponent } from './CountryListEmptyComponent';
import { COUNTRY_LIST_ITEM_HEIGHT, CountryListItem } from './CountryListItem';
import { Country } from '../../../types';

export type CountrySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onCountrySelect: (symbol: Country) => void;
    selectedCountryId?: string;
};

const keyExtractor = (item: Country) => item.value;

export const CountrySheet = ({
    isVisible,
    onClose,
    onCountrySelect,
    selectedCountryId,
}: CountrySheetProps) => {
    const onCountrySelectCallback = (country: Country) => {
        onCountrySelect(country);
        onClose();
    };

    const [filterValue, setFilterValue] = useState('');

    const filteredData = useMemo(() => {
        let data = regional.countriesOptions;
        if (filterValue?.length > 0) {
            data = data.filter(
                ({ label, value }) =>
                    label.toLowerCase().includes(filterValue.toLowerCase()) ||
                    value.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }

        return data;
    }, [filterValue]);

    // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
    const renderHandle = useCallback(
        () => (
            <SearchableSheetHeader
                onClose={onClose}
                title={<Translation id="moduleTrading.countrySheet.title" />}
                onFilterChange={setFilterValue}
            />
        ),
        [onClose],
    );

    const listHeight = Dimensions.get('window').height * 0.9;

    return (
        <BottomSheetFlashList<Country>
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
        />
    );
};
