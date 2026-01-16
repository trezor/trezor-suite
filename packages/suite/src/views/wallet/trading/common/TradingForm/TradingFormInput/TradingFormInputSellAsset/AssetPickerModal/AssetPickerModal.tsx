import { memo, useCallback, useState } from 'react';

import { TranslationKey } from '@suite/intl';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Divider } from '@trezor/components';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsModal,
    ExpandableAssetRowTokens,
} from 'src/components/suite/asset-picker/components';
import {
    AssetPickerListItem,
    useExpandableAccountGroups,
    useSearchFilter,
} from 'src/components/suite/asset-picker/hooks';

import { AssetListWrapper } from './AssetListWrapper';
import { UseUpdateFormInputProps, useUpdateFormInput } from './hooks/useUpdateFormInput';
import { AssetSearchWithNetworkFilter } from '../../TradingFormInputAssetPicker';
import { useBuildTradingAssetOptions } from './hooks/useBuildTradingAssetOptions';

export type AssetPickerModalProps = {
    closeModal: () => void;
    heading: TranslationKey;
    dataTestId: string;
    onAssetSelect: UseUpdateFormInputProps['onAssetSelect'];
};

export const AssetPickerModal = memo(function AssetPickerModalInner({
    closeModal,
    heading,
    onAssetSelect,
    dataTestId,
}: AssetPickerModalProps) {
    const { search, throttledSearch, setSearch } = useSearchFilter();

    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(undefined);
    const { expandedAccountTokensGroups, updateExpandableAccountGroups } =
        useExpandableAccountGroups();

    const { listItems, networks } = useBuildTradingAssetOptions({
        search: throttledSearch,
        networkSymbol: networkFilter,
        expandedNonTradableTokensGroups: expandedAccountTokensGroups,
    });

    const handleAssetClick = useUpdateFormInput({ closeModal, onAssetSelect });

    const renderItem = useCallback(
        (item: AssetPickerListItem) => {
            switch (item.type) {
                case 'account':
                    return (
                        <AssetRowAccountWithBalance
                            account={item.account}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`${dataTestId}/account`}
                        />
                    );

                case 'token':
                    return (
                        <AssetRowToken
                            token={item.token}
                            account={item.account}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`${dataTestId}/token`}
                        />
                    );

                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;

                case 'group-space':
                    return <AssetGroupSpace size={item.size} />;

                case 'non-tradable-tokens':
                    return (
                        <ExpandableAssetRowTokens
                            label="TR_NON_TRADABLE_TOKENS"
                            account={item.account}
                            tokens={item.tokens}
                            expanded={item.expanded}
                            onExpandToggle={updateExpandableAccountGroups}
                            height={item.height}
                            dataTestId={`${dataTestId}/non-tradable-tokens`}
                            showTokensPreview
                        />
                    );
            }
        },
        [dataTestId, handleAssetClick, updateExpandableAccountGroups],
    );

    return (
        <AssetsModal onClose={closeModal} heading={{ id: heading }}>
            <AssetSearchWithNetworkFilter
                placeholder="TR_ASSET_PICKER_SEARCH_PLACEHOLDER"
                search={search}
                setSearch={setSearch}
                networkFilter={networkFilter}
                setNetworkFilter={setNetworkFilter}
                networks={networks}
                dataTestId={dataTestId}
            />

            <Divider margin={{ top: 16 }} />

            <AssetListWrapper
                listItems={listItems}
                renderItem={renderItem}
                /**
                 * The listItems` contain fiat rates which are being frequently updated causing unwanted scroll position to be reset.
                 * Instead, hint the `useListScrollReset` hook to reset scroll position when network filter, search, or list items size changes.
                 */
                resetScrollTrigger={`${networkFilter}${search}${listItems.length}`}
            />
        </AssetsModal>
    );
});
