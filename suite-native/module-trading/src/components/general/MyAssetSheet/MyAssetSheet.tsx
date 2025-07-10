import { useSelector } from 'react-redux';

import { Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { BottomSheetSectionList } from '../BottomSheetSectionList';
import { MyAssetListEmptyComponent } from './MyAssetListEmptyComponent';
import { ASSET_ITEM_HEIGHT, MyAssetListItem } from './MyAssetListItem';
import { MyAssetListSectionHeader } from './MyAssetListSectionHeader';
import { selectExchangeAccountsWithTokensSectionList } from '../../../selectors/exchangeSelectors';
import { MyAsset, TradeableAsset } from '../../../types/general';
import { SimpleSheetHeader } from '../SimpleSheetHeader';

export type MyAssetSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: (asset: TradeableAsset) => void;
};

const keyExtractor = (asset: MyAsset, sectionData: Account) => `${sectionData.key}_${asset.name}`;

const renderItem = (
    asset: MyAsset,
    { sectionData }: { sectionData: Account },
    onAssetSelect: (asset: TradeableAsset) => void,
) => <MyAssetListItem asset={asset} account={sectionData} onPress={onAssetSelect} />;

export const MyAssetSheet = ({ isVisible, onClose, onAssetSelect }: MyAssetSheetProps) => {
    const onAssetSelectCallback = (asset: TradeableAsset) => {
        onAssetSelect(asset);
        onClose();
    };

    const myAssets = useSelector(selectExchangeAccountsWithTokensSectionList);

    const renderHandle = () => (
        <SimpleSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.myAssetSheet.title" />}
        />
    );

    return (
        <BottomSheetSectionList<MyAsset, Account>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<MyAssetListEmptyComponent />}
            handleComponent={renderHandle}
            data={myAssets}
            keyExtractor={keyExtractor}
            estimatedItemSize={ASSET_ITEM_HEIGHT}
            renderItem={(asset, config) => renderItem(asset, config, onAssetSelectCallback)}
            renderSectionHeader={(_label, config) => {
                const sectionIndex = myAssets.findIndex(
                    section => section.sectionData.key === config.sectionData.key,
                );

                return (
                    <MyAssetListSectionHeader
                        account={config.sectionData}
                        isFirst={sectionIndex === 0}
                    />
                );
            }}
        />
    );
};
