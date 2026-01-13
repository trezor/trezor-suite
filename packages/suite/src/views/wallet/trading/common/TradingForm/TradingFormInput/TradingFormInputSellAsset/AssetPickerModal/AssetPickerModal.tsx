import { memo, useCallback, useState } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Divider } from '@trezor/components';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAccountWithBalance,
    AssetRowToken,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { AssetPickerListItem, useSearchFilter } from 'src/components/suite/asset-picker/hooks';

import { AssetListWrapper } from './AssetListWrapper';
import { UseUpdateFormInputProps, useUpdateFormInput } from './hooks/useUpdateFormInput';
import { AssetSearchWithNetworkFilter } from '../../TradingFormInputAssetPicker';
import { useBuildTradingAssetOptions } from './hooks/useBuildTradingAssetOptions';

export type AssetPickerModalProps = {
    closeModal: () => void;
    heading: TranslationKey;
    dataTestId?: string;
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

    const { listItems, networks } = useBuildTradingAssetOptions({
        search: throttledSearch,
        networkSymbol: networkFilter,
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
            }
        },
        [dataTestId, handleAssetClick],
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
            />

            <Divider margin={{ top: 16 }} />

            <AssetListWrapper listItems={listItems} renderItem={renderItem} />
        </AssetsModal>
    );
});
