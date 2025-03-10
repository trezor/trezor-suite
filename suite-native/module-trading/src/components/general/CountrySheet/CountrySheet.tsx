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
const getEstimatedListHeight = (itemsCount: number) => itemsCount * COUNTRY_LIST_ITEM_HEIGHT;

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

    return (
        <BottomSheetFlashList<Country>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<CountryListEmptyComponent />}
            handleComponent={() => (
                <SearchableSheetHeader
                    onClose={onClose}
                    title={<Translation id="moduleTrading.countrySheet.title" />}
                />
            )}
            renderItem={({ item }) => (
                <CountryListItem
                    {...item}
                    onPress={() => onCountrySelectCallback(item)}
                    isSelected={item.value === selectedCountryId}
                />
            )}
            data={regional.countriesOptions}
            estimatedListHeight={getEstimatedListHeight(regional.countriesOptions.length)}
            estimatedItemSize={COUNTRY_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
        />
    );
};
