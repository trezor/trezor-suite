import { memo, useCallback } from 'react';
import { Dimensions, Keyboard } from 'react-native';

import {
    type TradingCountrySubdivisionOption,
    useCountrySubdivisionFilteredData,
} from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { EmptyComponent, SearchableSheetHeader } from '@suite-native/trading-atoms';

import { CountrySubdivisionListItem } from './CountrySubdivisionListItem';

export type CountrySubdivisionSheetProps = {
    countryCode: string | undefined;
    isVisible: boolean;
    onClose: () => void;
    onSubdivisionSelect: (subdivision: TradingCountrySubdivisionOption) => void;
    selectedSubdivisionId?: string;
    testID: string;
};

const keyExtractor = (item: TradingCountrySubdivisionOption) => item.value;

export const CountrySubdivisionSheet = memo(
    ({
        countryCode,
        isVisible,
        onClose,
        onSubdivisionSelect,
        selectedSubdivisionId,
        testID,
    }: CountrySubdivisionSheetProps) => {
        const { filteredData, filterValue, setFilterValue } =
            useCountrySubdivisionFilteredData(countryCode);
        const { translate } = useTranslate();

        const searchInputTestId = testID ? testID + '/search-input' : undefined;
        const bottomSheetTestId = testID ? testID + '/bottom-sheet' : undefined;

        const renderHandle = useCallback(
            () => (
                <SearchableSheetHeader
                    onClose={onClose}
                    title={<Translation id="tradingResidence.countrySubdivisionSheet.title" />}
                    onFilterChange={setFilterValue}
                    searchInputTestId={searchInputTestId}
                    searchInputPlaceholder={translate(
                        'tradingResidence.countrySubdivisionSheet.searchInputPlaceholder',
                    )}
                />
            ),
            [onClose, setFilterValue, translate, searchInputTestId],
        );

        const onSubdivisionSelectCallback = (subdivision: TradingCountrySubdivisionOption) => {
            Keyboard.dismiss();
            onSubdivisionSelect(subdivision);
            onClose();
        };

        const listHeight = Dimensions.get('window').height * 0.9;
        const flashListKey = 'country_subdivisions_list-' + filterValue;

        return (
            <BottomSheetFlashList<TradingCountrySubdivisionOption>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={
                    <EmptyComponent
                        title={
                            <Translation id="tradingResidence.countrySubdivisionSheet.emptyTitle" />
                        }
                        description={
                            <Translation id="tradingResidence.countrySubdivisionSheet.emptyDescription" />
                        }
                    />
                }
                handleComponent={renderHandle}
                renderItem={({ item }) => (
                    <CountrySubdivisionListItem
                        {...item}
                        onPress={() => onSubdivisionSelectCallback(item)}
                        isSelected={item.value === selectedSubdivisionId}
                    />
                )}
                data={filteredData}
                estimatedListHeight={listHeight}
                keyExtractor={keyExtractor}
                keyboardShouldPersistTaps="handled"
                flashListKey={flashListKey}
                extraData={selectedSubdivisionId}
                testID={bottomSheetTestId}
            />
        );
    },
);
