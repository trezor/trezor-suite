import { memo, useCallback, useState } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column } from '@trezor/components';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetGroupsCard,
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsModal,
    ExpandableAssetRowGroup,
} from 'src/components/suite/asset-picker/components';
import { useExpandableGroups, useSearchFilter } from 'src/components/suite/asset-picker/hooks';
import {
    type AccountWithOptionalLabel,
    type AssetGroupOption,
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

const getAccountTestId = (account: AccountWithOptionalLabel) =>
    `@asset-picker/sell/option/${account.accountType}/${account.symbol}/${account.index}`;

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

    const { handleAccountClick, handleTokenClick } = useUpdateFormInput({
        closeModal,
        onAssetSelect,
    });

    const renderAssetRow = useCallback(
        (item: AssetRowOption, { isInsideGroup = false, isSelectable = true } = {}) =>
            item.type === 'account' ? (
                <AssetRowAccountWithBalance
                    account={item.account}
                    onClick={isSelectable ? handleAccountClick : undefined}
                    isFiatPrimary
                    isInsideGroup={isInsideGroup}
                    dataTestId={getAccountTestId(item.account)}
                />
            ) : (
                <AssetRowToken
                    token={item.token}
                    account={item.account}
                    onClick={isSelectable ? handleTokenClick : undefined}
                    isFiatPrimary
                    isInsideGroup={isInsideGroup}
                    showNoTradingPairText={!isSelectable}
                    dataTestId={`${getAccountTestId(item.account)}/token/${item.token.symbol}`}
                />
            ),
        [handleAccountClick, handleTokenClick],
    );

    const renderAssetGroup = useCallback(
        (account: AccountWithOptionalLabel, group: AssetGroupOption) => {
            const isLowBalance = group.type === 'low-balance-group';

            return (
                <ExpandableAssetRowGroup
                    key={group.type}
                    label={
                        isLowBalance
                            ? 'TR_ASSET_PICKER_LOW_BALANCE'
                            : 'TR_ASSET_PICKER_NON_TRADABLE'
                    }
                    account={account}
                    items={group.items}
                    renderItem={groupItem =>
                        renderAssetRow(groupItem, {
                            isInsideGroup: true,
                            isSelectable: isLowBalance,
                        })
                    }
                    expanded={group.expanded}
                    onExpandToggle={expanded => {
                        toggleGroup(getAssetGroupKey(account.key, group.type), expanded);
                    }}
                    dataTestId={`${getAccountTestId(account)}/${
                        isLowBalance ? 'low-balance' : 'non-tradable'
                    }`}
                />
            );
        },
        [renderAssetRow, toggleGroup],
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

                case 'asset-groups':
                    return (
                        <AssetGroupsCard height={getAssetPickerItemHeight(item)}>
                            {item.groups.map(group => renderAssetGroup(item.account, group))}
                        </AssetGroupsCard>
                    );
            }
        },
        [renderAssetRow, renderAssetGroup],
    );

    return (
        <AssetsModal onClose={closeModal} heading={{ id: heading }} width={MODAL_WIDTH}>
            <Column gap={16}>
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
            </Column>
        </AssetsModal>
    );
});
