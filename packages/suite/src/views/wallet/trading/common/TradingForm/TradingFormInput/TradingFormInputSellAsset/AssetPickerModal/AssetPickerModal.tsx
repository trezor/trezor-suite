import { memo, useCallback, useState } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsModal,
    ExpandableAssetRowGroup,
} from 'src/components/suite/asset-picker/components';
import { useExpandableGroups, useSearchFilter } from 'src/components/suite/asset-picker/hooks';
import {
    type AssetPickerListItem,
    type AssetRowOption,
} from 'src/components/suite/asset-picker/types';
import {
    type AssetGroupKey,
    getAssetGroupKey,
} from 'src/components/suite/asset-picker/utils/assetGroupKey';
import { getAssetPickerItemHeight } from 'src/components/suite/asset-picker/utils/assetPickerItemHeights';

import { useBuildTradingAssetOptions } from './hooks/useBuildTradingAssetOptions';
import { type UseUpdateFormInputProps, useUpdateFormInput } from './hooks/useUpdateFormInput';
import { AssetListWrapper, AssetPickerSearchHeader } from '../../TradingFormInputAssetPicker';

const MODAL_WIDTH = 480;

export type AssetPickerModalProps = {
    closeModal: () => void;
    heading: TranslationKey;
    onAssetSelect: UseUpdateFormInputProps['onAssetSelect'];
};

export const AssetPickerModal = memo(function AssetPickerModalInner({
    closeModal,
    heading,
    onAssetSelect,
}: AssetPickerModalProps) {
    const { search, throttledSearch, setSearch } = useSearchFilter();

    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(undefined);
    const { expandedGroupKeys, toggleGroup } = useExpandableGroups<AssetGroupKey>();

    const { listItems, networks } = useBuildTradingAssetOptions({
        search: throttledSearch,
        networkSymbol: networkFilter,
        expandedGroupKeys,
    });

    const handleAssetClick = useUpdateFormInput({ closeModal, onAssetSelect });

    const renderAssetRow = useCallback(
        (item: AssetRowOption, { isInsideGroup = false, isSelectable = true } = {}) => {
            const onClick = isSelectable ? () => handleAssetClick(item) : undefined;

            return item.type === 'account' ? (
                <AssetRowAccountWithBalance
                    account={item.account}
                    onClick={onClick}
                    isFiatPrimary
                    isInsideGroup={isInsideGroup}
                    dataTestId={`@asset-picker/sell/option/${item.account.symbol}`}
                />
            ) : (
                <AssetRowToken
                    token={item.token}
                    account={item.account}
                    onClick={onClick}
                    isFiatPrimary
                    isInsideGroup={isInsideGroup}
                    showNoTradingPairText={!isSelectable}
                    dataTestId={`@asset-picker/sell/option/${item.account.symbol}/${item.token.symbol}`}
                />
            );
        },
        [handleAssetClick],
    );

    const renderItem = useCallback(
        (item: AssetPickerListItem) => {
            switch (item.type) {
                case 'account':
                case 'token':
                    return renderAssetRow(item);

                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;

                case 'group-space':
                    return <AssetGroupSpace size={item.size} />;

                case 'low-balance-group':
                case 'non-tradable-group': {
                    const isLowBalance = item.type === 'low-balance-group';

                    return (
                        <ExpandableAssetRowGroup
                            label={
                                isLowBalance
                                    ? 'TR_ASSET_PICKER_LOW_BALANCE'
                                    : 'TR_ASSET_PICKER_NON_TRADABLE'
                            }
                            account={item.account}
                            items={item.items}
                            renderItem={groupItem =>
                                renderAssetRow(groupItem, {
                                    isInsideGroup: true,
                                    isSelectable: isLowBalance,
                                })
                            }
                            expanded={item.expanded}
                            onExpandToggle={expanded => {
                                toggleGroup(
                                    getAssetGroupKey(item.account.key, item.type),
                                    expanded,
                                );
                            }}
                            dataTestId={`@asset-picker/sell/option/${
                                isLowBalance ? 'low-balance' : 'non-tradable'
                            }/${item.account.symbol}`}
                        />
                    );
                }
            }
        },
        [renderAssetRow, toggleGroup],
    );

    return (
        <AssetsModal onClose={closeModal} heading={{ id: heading }} width={MODAL_WIDTH}>
            <AssetPickerSearchHeader
                placeholder="TR_ASSET_PICKER_SEARCH_PLACEHOLDER"
                search={search}
                setSearch={setSearch}
                networkFilter={networkFilter}
                setNetworkFilter={setNetworkFilter}
                networks={networks}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
            />

            <AssetListWrapper
                listItems={listItems}
                renderItem={renderItem}
                getItemHeight={getAssetPickerItemHeight}
                resetScrollTrigger={`${networkFilter}${search}${listItems.length}`}
            />
        </AssetsModal>
    );
});
