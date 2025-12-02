import { memo, useCallback, useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Divider } from '@trezor/components';
import { TopAssets } from '@trezor/product-components';

import {
    ASSET_ROW_ASSET_HEIGHT,
    AssetGroupLabel,
    AssetRowAccountWithBalance,
    AssetRowAsset,
    AssetRowToken,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';

import { AssetListWrapper } from './AssetListWrapper';
import { AssetSearchWithNetworkFilter } from './AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';
import { TradingAssetListItem } from './hooks/useBuildTradingAssetOptions';
import { useSearchFilter } from './hooks/useSearchFilter';
import { UseUpdateFormInputProps, useUpdateFormInput } from './hooks/useUpdateFormInput';

export type AssetPickerModalProps = {
    closeModal: () => void;
    dataTestId?: string;
    onAssetSelect: UseUpdateFormInputProps['onAssetSelect'];
};

export const AssetPickerModal = memo(function AssetPickerModalInner({
    closeModal,
    onAssetSelect,
    dataTestId,
}: AssetPickerModalProps) {
    const { search, throttledSearch, setSearch } = useSearchFilter();
    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(undefined);

    const handleAssetClick = useUpdateFormInput({ closeModal, onAssetSelect });

    const renderItem = useCallback(
        (item: TradingAssetListItem) => {
            switch (item.type) {
                case 'top-five-assets':
                    return (
                        <TopAssets
                            assets={item.assets}
                            onAssetClick={topAsset =>
                                handleAssetClick({
                                    type: 'asset',
                                    asset: item.assets.find(asset => asset.id === topAsset.id)!,
                                    height: ASSET_ROW_ASSET_HEIGHT,
                                })
                            }
                            data-testid={`${dataTestId}/top-five-assets`}
                            margin={{ horizontal: 16 }}
                        />
                    );

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

                case 'asset':
                    return (
                        <AssetRowAsset
                            asset={item.asset}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`${dataTestId}/asset`}
                        />
                    );

                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;
            }
        },
        [dataTestId, handleAssetClick],
    );

    return (
        <AssetsModal
            onClose={closeModal}
            size="small"
            heading={{ id: 'TR_SWAP_ASSET_PICKER_HEADING' }}
        >
            <AssetSearchWithNetworkFilter
                placeholder="TR_ASSET_PICKER_SEARCH_PLACEHOLDER"
                search={search}
                setSearch={setSearch}
                networkFilter={networkFilter}
                setNetworkFilter={setNetworkFilter}
            />

            <Divider />

            <AssetListWrapper
                search={throttledSearch}
                networkSymbol={networkFilter}
                renderItem={renderItem}
            />
        </AssetsModal>
    );
});
