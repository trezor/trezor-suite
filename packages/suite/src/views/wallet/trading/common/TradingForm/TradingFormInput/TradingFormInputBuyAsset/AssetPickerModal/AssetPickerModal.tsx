import { memo, useCallback, useState } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Divider } from '@trezor/components';
import { TopAssets } from '@trezor/product-components';

import {
    AssetGroupLabel,
    AssetRowAccountWithBalance,
    AssetRowAsset,
    AssetRowToken,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSearchFilter } from 'src/components/suite/asset-picker/hooks';

import { AssetListWrapper } from './AssetListWrapper';
import {
    type TradingAssetListItem,
    useBuildTradingAssetOptions,
} from './hooks/useBuildTradingAssetOptions';
import { type UseUpdateFormInputProps, useUpdateFormInput } from './hooks/useUpdateFormInput';
import { AssetSearchWithNetworkFilter } from '../../TradingFormInputAssetPicker';

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
    const [networkSymbol, setNetworkSymbol] = useState<NetworkSymbol | undefined>(undefined);

    const { listItems, networks } = useBuildTradingAssetOptions({
        search: throttledSearch,
        networkSymbol,
    });

    const handleAssetClick = useUpdateFormInput({ closeModal, onAssetSelect });

    const renderItem = useCallback(
        (item: TradingAssetListItem) => {
            switch (item.type) {
                case 'top-assets':
                    return (
                        <Box margin={{ horizontal: 8, top: 8 }}>
                            <TopAssets
                                assets={item.assets}
                                onAssetClick={topAsset =>
                                    handleAssetClick({
                                        type: 'asset',
                                        asset: item.assets.find(asset => asset.id === topAsset.id)!,
                                        height: ASSET_ROW_HEIGHT,
                                    })
                                }
                                data-testid="@asset-picker/buy/option/top-assets"
                            />
                        </Box>
                    );

                case 'account':
                    return (
                        <AssetRowAccountWithBalance
                            account={item.account}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`@asset-picker/buy/option/${item.account.symbol}`}
                        />
                    );

                case 'token':
                    return (
                        <AssetRowToken
                            token={item.token}
                            account={item.account}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`@asset-picker/buy/option/${item.account.symbol}/${item.token.symbol}`}
                        />
                    );

                case 'asset':
                    return (
                        <AssetRowAsset
                            asset={item.asset}
                            onClick={() => handleAssetClick(item)}
                            dataTestId={`@asset-picker/buy/option/asset/${item.asset.id}`}
                        />
                    );

                case 'group-label':
                    return <AssetGroupLabel label={item.label} />;
            }
        },
        [handleAssetClick],
    );

    return (
        <AssetsModal onClose={closeModal} heading={{ id: heading }}>
            <AssetSearchWithNetworkFilter
                placeholder="TR_ASSET_PICKER_SEARCH_PLACEHOLDER"
                search={search}
                setSearch={setSearch}
                networkFilter={networkSymbol}
                setNetworkFilter={setNetworkSymbol}
                networks={networks}
            />

            <Divider margin={{ top: 16 }} />

            <AssetListWrapper
                renderItem={renderItem}
                listItems={listItems}
                resetScrollTrigger={`${networkSymbol}${throttledSearch}${listItems.length}`}
            />
        </AssetsModal>
    );
});
