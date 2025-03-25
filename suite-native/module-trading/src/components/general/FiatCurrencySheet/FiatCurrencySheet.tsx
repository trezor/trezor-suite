import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FiatCurrencyCode } from 'invity-api';

import { Translation } from '@suite-native/intl';

import { selectBuySupportedFiatCurrenciesList } from '../../../selectors/buySelectors';
import { FiatCurrencyItem } from '../../../types';
import {
    SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
    SearchableSheetHeader,
} from '../SearchableSheetHeader';
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

    const data = useMemo(
        () => [
            {
                key: 'fiat_currency',
                label: '' as ReactNode,
                data: supportedCurrencies,
                sectionData: undefined,
            },
        ],
        [supportedCurrencies],
    );

    const onFiatSelectCallback = (currency: FiatCurrencyCode) => {
        onFiatSelect(currency);
        onClose();
    };

    return (
        <TradingBottomSheetSectionList<FiatCurrencyItem>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<FiatCurrencyListEmptyComponent />}
            handleComponent={() => (
                <SearchableSheetHeader
                    onClose={onClose}
                    title={<Translation id="moduleTrading.fiatCurrencySheet.title" />}
                />
            )}
            renderItem={({ value, ...rest }) => (
                <FiatCurrencyListItem {...rest} onPress={() => onFiatSelectCallback(value)} />
            )}
            data={data}
            estimatedHeaderHeight={SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT}
            estimatedItemSize={FIAT_CURRENCY_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
            noSingletonSectionHeader
        />
    );
};
