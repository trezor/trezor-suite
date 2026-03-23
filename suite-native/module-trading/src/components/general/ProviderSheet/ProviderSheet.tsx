import { useSelector } from 'react-redux';

import {
    type TradingTradeMapProps,
    type TradingTradeType,
    type TradingType,
} from '@suite-common/trading';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { BottomSheetSectionList } from '@suite-native/trading-atoms';
import { type TradingWithFeatureFlagsRootState } from '@suite-native/trading-state';
import { type QuotesByCategories, type QuotesCategory } from '@suite-native/trading-types';
import { prepareNativeStyle } from '@trezor/styles';

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
    const areTradingExchangeDexesEnabled = useSelector((state: TradingWithFeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.AreTradingExchangeDexesEnabled),
    );
    const shouldShowFilters = tradingType === 'exchange' && areTradingExchangeDexesEnabled;

    const { filterItems, filteredSections, selectedFilter, setSelectedFilter } = useProviderFilters(
        quotes,
        shouldShowFilters,
        areTradingExchangeDexesEnabled,
    );

    const onQuoteSelectCallback = (quote: T) => {
        onQuoteSelect(quote);
        onClose();
    };

    return (
        <BottomSheetSectionList<T, QuotesCategory>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={item => (
                <ProviderListItem
                    onPress={onQuoteSelectCallback}
                    isSelected={item.orderId === selectedQuote?.orderId}
                    quote={item}
                    tradingType={tradingType}
                />
            )}
            handleComponent={() => (
                <ProviderSheetHandle
                    onClose={onClose}
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
