import {
    type TradingTradeMapProps,
    type TradingTradeType,
    type TradingType,
} from '@suite-common/trading';
import { type BottomSheetFlashListHandleProps } from '@suite-native/atoms';
import { BottomSheetSectionList } from '@suite-native/trading-atoms';
import { type QuotesByCategories, type QuotesCategory } from '@suite-native/trading-types';
import { prepareNativeStyle } from '@trezor/styles-native';

import { useProviderFilters } from '../../../hooks/general/useProviderFilters';
import { LegalGatewayContextMessage } from '../LegalGatewayContextMessage';
import { NoProvidersPlaceholder } from './NoProvidersPlaceholder';
import { ProviderListItem } from './ProviderListItem';
import { ProviderSheetHandle } from './ProviderSheetHandle';
import { ProviderSheetSectionHeader } from './ProviderSheetSectionHeader';

export type ProviderSheetProps<K extends TradingType, T extends TradingTradeType> = {
    quotes: QuotesByCategories<T>;
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: T) => void;
    selectedQuote?: T;
    tradingType: K;
};

const keyExtractor = <T extends TradingTradeType>(item: T) => item.orderId ?? '';

const EMPTY_ITEM_STYLE = prepareNativeStyle(() => ({}));

export const ProviderSheet = <
    K extends TradingType,
    T extends TradingTradeType = TradingTradeMapProps[K],
>({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
    tradingType,
}: ProviderSheetProps<K, T>) => {
    const shouldShowFilters = tradingType === 'exchange';
    const shouldShowExchangeType = tradingType === 'exchange';

    const { filterItems, filteredSections, selectedFilter, setSelectedFilter } = useProviderFilters(
        quotes,
        shouldShowFilters,
    );

    return (
        <BottomSheetSectionList<T, QuotesCategory>
            isVisible={isVisible}
            onClose={onClose}
            scrollResetKey={selectedFilter}
            renderItem={(item, _config, { closeSheet }) => (
                <ProviderListItem
                    onPress={quote => {
                        onQuoteSelect(quote);
                        closeSheet();
                    }}
                    isSelected={item.orderId === selectedQuote?.orderId}
                    quote={item}
                    shouldShowExchangeType={shouldShowExchangeType}
                    tradingType={tradingType}
                />
            )}
            handleComponent={({ closeSheet }: BottomSheetFlashListHandleProps) => (
                <ProviderSheetHandle
                    onClose={closeSheet}
                    shouldShowFilters={shouldShowFilters}
                    filterItems={filterItems}
                    selectedFilter={selectedFilter}
                    setSelectedFilter={setSelectedFilter}
                />
            )}
            ListFooterComponent={<LegalGatewayContextMessage marginVertical="sp12" />}
            data={filteredSections}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
            renderSectionHeader={(_label, { sectionData }) => (
                <ProviderSheetSectionHeader category={sectionData} />
            )}
            itemStyle={EMPTY_ITEM_STYLE}
            noSingletonSectionHeader={tradingType !== 'exchange'}
            SectionEmptyComponent={<NoProvidersPlaceholder />}
            ListEmptyComponent={<NoProvidersPlaceholder />}
        />
    );
};
