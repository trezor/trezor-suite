import { useMemo, useState } from 'react';

import { TradingProviderInfo, TradingTradeType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle } from '@trezor/styles';
import { exhaustive } from '@trezor/type-utils';

import { FilterItem, FilterTabs } from '../FilterTabs';
import { LegalGatewayContextMessage } from '../LegalGatewayContextMessage';
import { SimpleSheetHeader } from '../SimpleSheetHeader';
import { PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT, ProviderListItem } from './ProviderListItem';
import { SectionListData } from '../../../hooks/general/useSectionList';
import { BottomSheetSectionList } from '../BottomSheetSectionList';
import { TradingTypeAwareContextMessage } from '../TradingTypeAwareContextMessage';
import { CexFixedSectionHeader } from './CexFixedSectionHeader';
import { CexFloatSectionHeader } from './CexFloatSectionHeader';
import { DexSectionHeader } from './DexSectionHeader';

export type ProvidersSheetProps<T extends TradingTradeType> = {
    quotes: {
        fixed?: T[];
        float?: T[];
        dex?: T[];
    };
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: T) => void;
    selectedQuote?: T;
    providerInfos: { [name: string]: TradingProviderInfo };
};

type FilterValue = 'all' | 'cex' | 'dex';

const keyExtractor = <T extends TradingTradeType>(item: T) => item.orderId ?? '';

const getProviderInfo = (
    id: string | undefined,
    providerInfos: ProvidersSheetProps<TradingTradeType>['providerInfos'],
) =>
    providerInfos[id ?? ''] ?? {
        companyName: '',
        logo: '',
    };

const EMPTY_ITEM_STYLE = prepareNativeStyle(() => ({}));

export const ProviderSheet = <T extends TradingTradeType>({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
    providerInfos,
}: ProvidersSheetProps<T>) => {
    const { translate } = useTranslate();

    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');

    const onQuoteSelectCallback = (quote: T) => {
        onQuoteSelect(quote);
        onClose();
    };

    const hasFixedProviders = quotes.fixed && quotes.fixed.length > 0;
    const hasFloatProviders = quotes.float && quotes.float.length > 0;
    const hasDexProviders = quotes.dex && quotes.dex.length > 0;
    const hasCexProviders = hasFixedProviders || hasFloatProviders;
    const shouldShowFilters = hasCexProviders && hasDexProviders;
    const shouldShowCategories =
        [hasFixedProviders, hasFloatProviders, hasDexProviders].filter(Boolean).length > 1;

    const filterItems: FilterItem<FilterValue>[] = useMemo(
        () => [
            { label: translate('moduleTrading.providerSheet.filters.all'), value: 'all' },
            { label: translate('moduleTrading.providerSheet.filters.cex'), value: 'cex' },
            { label: translate('moduleTrading.providerSheet.filters.dex'), value: 'dex' },
        ],
        [translate],
    );

    type QuoteCategory = keyof typeof quotes;

    const filteredSections: SectionListData<T, QuoteCategory> = useMemo(() => {
        const allSections = Object.entries(quotes).map(([category, items]) => {
            const typedCategory = category as QuoteCategory;

            return {
                key: category,
                data: items,
                label: '',
                sectionData: typedCategory,
            };
        });

        if (!shouldShowFilters || selectedFilter === 'all') {
            return allSections;
        }

        if (selectedFilter === 'cex') {
            return allSections.filter(
                section => section.key === 'fixed' || section.key === 'float',
            );
        }

        if (selectedFilter === 'dex') {
            return allSections.filter(section => section.key === 'dex');
        }

        return allSections;
    }, [quotes, selectedFilter, shouldShowFilters]);

    return (
        <BottomSheetSectionList<T, QuoteCategory>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={item => {
                const provider = getProviderInfo(item.exchange, providerInfos);

                return (
                    <ProviderListItem
                        onPress={onQuoteSelectCallback}
                        isSelected={item.orderId === selectedQuote?.orderId}
                        quote={item}
                        provider={provider}
                    />
                );
            }}
            handleComponent={() => (
                <>
                    <SimpleSheetHeader
                        onClose={onClose}
                        title={translate('moduleTrading.providerSheet.title')}
                    >
                        {shouldShowFilters && (
                            <FilterTabs
                                items={filterItems}
                                onChange={setSelectedFilter}
                                value={selectedFilter}
                                keyExtractor={item => item.value}
                            />
                        )}
                    </SimpleSheetHeader>

                    <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp4" />
                </>
            )}
            ListFooterComponent={<LegalGatewayContextMessage marginVertical="sp12" />}
            data={filteredSections}
            estimatedItemSize={PROVIDER_LIST_ITEM_ESTIMATED_HEIGHT}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
            renderSectionHeader={(_label, { sectionData }) => {
                if (!shouldShowCategories) {
                    return <></>;
                }

                switch (sectionData) {
                    case 'fixed':
                        return <CexFixedSectionHeader />;
                    case 'float':
                        return <CexFloatSectionHeader />;
                    case 'dex':
                        return <DexSectionHeader />;
                    default:
                        return exhaustive(sectionData);
                }
            }}
            itemStyle={EMPTY_ITEM_STYLE}
        />
    );
};
