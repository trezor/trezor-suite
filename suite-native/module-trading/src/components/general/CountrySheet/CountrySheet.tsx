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

const mockCountries: Country[] = [
    { id: 'us', name: 'United States', flag: 'flag' },
    { id: 'cz', name: 'Czech Republic', flag: 'flagCheckered' },
    { id: 'sk', name: 'Slovakia', flag: 'flag' },
    { id: 'de', name: 'Germany', flag: 'flagCheckered' },
    { id: 'fr', name: 'France', flag: 'flag' },
    { id: 'es', name: 'Spain', flag: 'flagCheckered' },
    { id: 'it', name: 'Italy', flag: 'flag' },
    { id: 'pl', name: 'Poland', flag: 'flagCheckered' },
    { id: 'hu', name: 'Hungary', flag: 'flag' },
    { id: 'at', name: 'Austria', flag: 'flagCheckered' },
    { id: 'ch', name: 'Switzerland', flag: 'flag' },
];

const keyExtractor = (item: Country) => item.id;
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

    const data: Country[] = mockCountries;

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
                    isSelected={item.id === selectedCountryId}
                />
            )}
            data={data}
            estimatedListHeight={getEstimatedListHeight(data.length)}
            estimatedItemSize={COUNTRY_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
        />
    );
};
