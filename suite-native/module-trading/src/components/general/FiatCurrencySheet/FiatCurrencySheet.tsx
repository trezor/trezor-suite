import { useCallback } from 'react';

import { FiatCurrencyCode } from 'invity-api';

import { Translation, useTranslate } from '@suite-native/intl';

import { useFiatCurrencyFilteredData } from '../../../hooks/general/useFiatCurrencyFilteredData';
import { FiatCurrencyItem } from '../../../types';
import { BottomSheetSectionList } from '../BottomSheetSectionList';
import { SearchableSheetHeader } from '../SearchableSheetHeader';
import { FiatCurrencyListEmptyComponent } from './FiatCurrencyListEmptyComponent';
import { FIAT_CURRENCY_LIST_ITEM_HEIGHT, FiatCurrencyListItem } from './FiatCurrencyListItem';

export type FiatCurrencySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onFiatSelect: (currency: FiatCurrencyCode) => void;
};

const keyExtractor = (item: FiatCurrencyItem) => item.value;

export const FiatCurrencySheet = ({ isVisible, onClose, onFiatSelect }: FiatCurrencySheetProps) => {
    const { filteredData, filterValue, setFilterValue } = useFiatCurrencyFilteredData();
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
            />
        ),
        [onClose, setFilterValue, translate],
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
                <FiatCurrencyListItem {...rest} onPress={() => onFiatSelectCallback(value)} />
            )}
            data={filteredData}
            estimatedItemSize={FIAT_CURRENCY_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
            flashListKey={flashListKey}
            noSingletonSectionHeader
        />
    );
};
