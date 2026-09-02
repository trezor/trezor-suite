import { memo, useCallback, useState } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column } from '@trezor/components';

import { AssetRowAsset, AssetsModal } from 'src/components/suite/asset-picker/components';
import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSearchFilter } from 'src/components/suite/asset-picker/hooks';

import {
    type TradingAssetListItem,
    useBuildTradingAssetOptions,
} from './hooks/useBuildTradingAssetOptions';
import { AssetListWrapper, AssetPickerSearchHeader } from '../../TradingFormInputAssetPicker';

const getItemHeight = () => ASSET_ROW_HEIGHT;

export type AssetPickerModalProps = {
    closeModal: () => void;
    heading: TranslationKey;
    onAssetSelect: (asset: TradingAssetOption) => void;
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

    const handleAssetClick = useCallback(
        (asset: TradingAssetOption) => {
            onAssetSelect(asset);
            closeModal();
        },
        [closeModal, onAssetSelect],
    );

    const renderItem = useCallback(
        (item: TradingAssetListItem) => (
            <AssetRowAsset
                asset={item.asset}
                balance={item.balance}
                onClick={handleAssetClick}
                dataTestId={`@asset-picker/buy/option/asset/${item.asset.id}`}
            />
        ),
        [handleAssetClick],
    );

    return (
        <AssetsModal onClose={closeModal} heading={{ id: heading }} width={480}>
            <Column gap={8}>
                <AssetPickerSearchHeader
                    placeholder="TR_ASSET_PICKER_SEARCH_PLACEHOLDER"
                    search={search}
                    setSearch={setSearch}
                    networkFilter={networkSymbol}
                    setNetworkFilter={setNetworkSymbol}
                    networks={networks}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                />

                <AssetListWrapper
                    renderItem={renderItem}
                    listItems={listItems}
                    getItemHeight={getItemHeight}
                    resetScrollTrigger={`${networkSymbol}${throttledSearch}${listItems.length}`}
                />
            </Column>
        </AssetsModal>
    );
});
