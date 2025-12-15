import { useTranslate } from '@suite-native/intl';
import { type FilterItem, FilterTabs } from '@suite-native/trading-atoms';

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

    return (
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
                        keyExtractor={({ value }) => value}
                    />
                )}
            </SimpleSheetHeader>

            <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp4" />
        </>
    );
};
