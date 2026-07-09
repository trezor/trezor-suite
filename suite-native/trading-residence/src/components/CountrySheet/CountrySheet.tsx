import { memo, useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';

import { type TradingCountryOption, useCountryFilteredData } from '@suite-common/trading';
import { type BottomSheetFlashListHandleProps, Divider } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { BottomSheetSectionList, SearchableSheetHeader } from '@suite-native/trading-atoms';

import { CountryListEmptyComponent } from './CountryListEmptyComponent';
import { CountryListItem } from './CountryListItem';

type CountrySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onCountrySelect: (symbol: TradingCountryOption) => void;
    selectedCountryId?: string;
    testID: string;
};

const keyExtractor = (item: TradingCountryOption) => item.value;
const ItemSeparator = () => <Divider />;

export const CountrySheet = memo(
    ({ isVisible, onClose, onCountrySelect, selectedCountryId, testID }: CountrySheetProps) => {
        const { filteredData, filterValue, setFilterValue } = useCountryFilteredData();
        const { translate } = useTranslate();

        const searchInputTestId = testID ? testID + '/search-input' : undefined;
        const bottomSheetTestId = testID ? testID + '/bottom-sheet' : undefined;

        // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
        const renderHandle = useCallback(
            ({ closeSheet }: BottomSheetFlashListHandleProps) => (
                <SearchableSheetHeader
                    onClose={closeSheet}
                    title={<Translation id="tradingResidence.countrySheet.title" />}
                    onFilterChange={setFilterValue}
                    searchInputTestId={searchInputTestId}
                    searchInputPlaceholder={translate(
                        'tradingResidence.countrySheet.searchInputPlaceholder',
                    )}
                />
            ),
            [setFilterValue, translate, searchInputTestId],
        );

        const listData = useMemo(
            () => [
                {
                    key: 'countries',
                    label: '',
                    data: filteredData,
                    sectionData: undefined,
                },
            ],
            [filteredData],
        );

        return (
            <BottomSheetSectionList<TradingCountryOption>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={<CountryListEmptyComponent />}
                handleComponent={renderHandle}
                renderItem={(item, _config, { closeSheet }) => (
                    <CountryListItem
                        {...item}
                        onPress={() => {
                            Keyboard.dismiss();
                            onCountrySelect(item);
                            closeSheet();
                        }}
                    />
                )}
                data={listData}
                keyExtractor={keyExtractor}
                // reset scroll position when filterValue changes
                scrollResetKey={filterValue}
                extraData={selectedCountryId}
                testID={bottomSheetTestId}
                ItemSeparatorComponent={ItemSeparator}
                noSingletonSectionHeader
            />
        );
    },
);
