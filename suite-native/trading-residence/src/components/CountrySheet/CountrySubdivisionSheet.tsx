import { memo, useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';

import {
    type TradingCountrySubdivisionOption,
    useCountrySubdivisionFilteredData,
} from '@suite-common/trading';
import { Divider } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    BottomSheetSectionList,
    EmptyComponent,
    SearchableSheetHeader,
} from '@suite-native/trading-atoms';

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
const ItemSeparator = () => <Divider />;

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

        const searchInputTestId = `${testID}/search-input`;
        const bottomSheetTestId = `${testID}/bottom-sheet`;

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

        const listData = useMemo(
            () => [
                {
                    key: 'country_subdivisions',
                    label: '',
                    data: filteredData,
                    sectionData: undefined,
                },
            ],
            [filteredData],
        );

        const flashListKey = 'country_subdivisions_list-' + filterValue;

        return (
            <BottomSheetSectionList<TradingCountrySubdivisionOption>
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
                renderItem={item => (
                    <CountrySubdivisionListItem
                        {...item}
                        onPress={() => onSubdivisionSelectCallback(item)}
                    />
                )}
                data={listData}
                keyExtractor={keyExtractor}
                flashListKey={flashListKey}
                extraData={selectedSubdivisionId}
                testID={bottomSheetTestId}
                noSingletonSectionHeader
                ItemSeparatorComponent={ItemSeparator}
            />
        );
    },
);
