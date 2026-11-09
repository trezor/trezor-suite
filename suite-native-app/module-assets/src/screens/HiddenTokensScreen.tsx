import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { WalletAssetCardSegment, WalletAssetListItem } from '@suite-native/assets';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { HiddenTokensEmptyState } from '../components/HiddenTokensEmptyState';
import { HiddenTokensSectionHeader } from '../components/HiddenTokensSectionHeader';
import { HiddenTokensSectionSeparator } from '../components/HiddenTokensSectionSeparator';
import {
    type HiddenTokensListEntry,
    selectHiddenTokensListEntries,
} from '../hiddenTokensListSelectors';

const getEntryKey = (entry: HiddenTokensListEntry) => {
    switch (entry.type) {
        case 'section-header':
            return `section-header-${entry.reason}`;
        case 'asset':
            return entry.assetKey;
        default:
            return exhaustive(entry);
    }
};

const getEntryType = (entry: HiddenTokensListEntry) => entry.type;

const renderEntryContent = (entry: HiddenTokensListEntry) => {
    switch (entry.type) {
        case 'section-header':
            return <HiddenTokensSectionHeader reason={entry.reason} />;
        case 'asset':
            return <WalletAssetListItem assetKey={entry.assetKey} />;
        default:
            return exhaustive(entry);
    }
};

type RenderEntryParams = {
    item: HiddenTokensListEntry;
    index: number;
};

export const HiddenTokensScreen = () => {
    const entries = useSelector(selectHiddenTokensListEntries);

    const renderEntry = ({ item, index }: RenderEntryParams) => (
        <WalletAssetCardSegment isFirst={index === 0} isLast={index === entries.length - 1}>
            {renderEntryContent(item)}
        </WalletAssetCardSegment>
    );

    return (
        <Screen
            header={
                <ScreenHeader title={<Translation id="moduleAssets.hiddenTokensScreen.title" />} />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <FlashList
                testID="@hidden-tokens/list"
                data={entries}
                renderItem={renderEntry}
                keyExtractor={getEntryKey}
                getItemType={getEntryType}
                ItemSeparatorComponent={HiddenTokensSectionSeparator}
                // Hiding a token on its detail inserts a section above the rows; anchoring on a row
                // would scroll away from it.
                maintainVisibleContentPosition={{ disabled: true }}
                ListEmptyComponent={HiddenTokensEmptyState}
            />
        </Screen>
    );
};
