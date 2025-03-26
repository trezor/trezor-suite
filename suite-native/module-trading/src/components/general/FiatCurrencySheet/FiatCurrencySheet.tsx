import { ReactNode, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { FiatCurrencyCode } from 'invity-api';

import { Translation } from '@suite-native/intl';

import { selectBuySupportedFiatCurrenciesList } from '../../../selectors/buySelectors';
import { FiatCurrencyItem } from '../../../types';
import { SearchableSheetHeader } from '../SearchableSheetHeader';
import { TradingBottomSheetSectionList } from '../TradingBottomSheetSectionList';
import { FiatCurrencyListEmptyComponent } from './FiatCurrencyListEmptyComponent';
import { FIAT_CURRENCY_LIST_ITEM_HEIGHT, FiatCurrencyListItem } from './FiatCurrencyListItem';

export type FiatCurrencySheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onFiatSelect: (currency: FiatCurrencyCode) => void;
};

const keyExtractor = (item: FiatCurrencyItem) => item.value;

export const FiatCurrencySheet = ({ isVisible, onClose, onFiatSelect }: FiatCurrencySheetProps) => {
    const supportedCurrencies = useSelector(selectBuySupportedFiatCurrenciesList);

    const onFiatSelectCallback = (currency: FiatCurrencyCode) => {
        onFiatSelect(currency);
        onClose();
    };

    const [filterValue, setFilterValue] = useState('');

    const filteredData = useMemo(() => {
        let data = supportedCurrencies;
        if (filterValue?.length > 0) {
            data = data.filter(
                ({ label, value }) =>
                    label.toLowerCase().includes(filterValue.toLowerCase()) ||
                    value.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }

        return [
            {
                key: 'fiat_currency',
                label: '' as ReactNode,
                data,
                sectionData: undefined,
            },
        ];
    }, [filterValue, supportedCurrencies]);

    // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
    const renderHandle = useCallback(
        () => (
            <SearchableSheetHeader
                key="fiat_currency"
                onClose={onClose}
                title={<Translation id="moduleTrading.fiatCurrencySheet.title" />}
                onFilterChange={setFilterValue}
            />
        ),
        [onClose],
    );

    return (
        <TradingBottomSheetSectionList<FiatCurrencyItem>
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
            noSingletonSectionHeader
        />
    );
};
