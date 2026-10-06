import { type SubTabItem, SubTabs } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type FilterItem } from '@suite-native/trading-atoms';

import { type FilterValue } from '../../../hooks/general/useProviderFilters';
import { SimpleSheetHeader } from '../SimpleSheetHeader';
import { TradingTypeAwareContextMessage } from '../TradingTypeAwareContextMessage';

export type ProviderSheetHandleProps = {
    onClose: () => void;
    shouldShowFilters: boolean;
    filterItems: FilterItem<FilterValue>[];
    selectedFilter: FilterValue;
    setSelectedFilter: (value: FilterValue) => void;
};

export const ProviderSheetHandle = ({
    filterItems,
    selectedFilter,
    setSelectedFilter,
    shouldShowFilters,
    onClose,
}: ProviderSheetHandleProps) => {
    const { translate } = useTranslate();

    const items: SubTabItem<FilterValue>[] = filterItems.map(item => ({
        label: item.label,
        value: item.value,
        testID: `@trading/provider-sheet/filter-tab/${item.value}`,
    }));

    return (
        <>
            <SimpleSheetHeader
                onClose={onClose}
                title={translate('moduleTrading.providerSheet.title')}
            >
                {shouldShowFilters && (
                    <SubTabs
                        testID="@trading/provider-sheet/"
                        items={items}
                        onChange={setSelectedFilter}
                        value={selectedFilter}
                        keyExtractor={({ value }) => value}
                    />
                )}
            </SimpleSheetHeader>

            <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp4" />
        </>
    );
};
