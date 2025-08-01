import { memo } from 'react';
import { useSelector } from 'react-redux';

import { TradingType } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { BottomSheetSectionList } from '../BottomSheetSectionList';
import { MyAssetListEmptyComponent } from './MyAssetListEmptyComponent';
import { ASSET_ITEM_HEIGHT, MyAssetListItem, MyAssetListItemProps } from './MyAssetListItem';
import { MyAssetListSectionHeader } from './MyAssetListSectionHeader';
import {
    CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '../../../selectors/commonSelectors';
import { MyAsset, TradeableAsset } from '../../../types/general';
import { SimpleSheetHeader } from '../SimpleSheetHeader';

export type MyAssetSheetProps = {
    tradingType: TradingType;
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: MyAssetListItemProps['onPress'];
};

const keyExtractor = (asset: MyAsset, sectionData: Account) => `${sectionData.key}_${asset.name}`;

const renderItem = (
    asset: MyAsset,
    { sectionData }: { sectionData: Account },
    onAssetSelect: MyAssetListItemProps['onPress'],
) => <MyAssetListItem asset={asset} account={sectionData} onPress={onAssetSelect} />;

export const MyAssetSheet = memo(
    ({ tradingType, isVisible, onClose, onAssetSelect }: MyAssetSheetProps) => {
        const onAssetSelectCallback = (asset: TradeableAsset, account: Account) => {
            onAssetSelect(asset, account);
            onClose();
        };

        const myAssets = useSelector((state: CombinedSelectorsRootState) =>
            selectAccountsWithTokensToSellSectionListByTradingType(state, tradingType),
        );

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
    },
);
