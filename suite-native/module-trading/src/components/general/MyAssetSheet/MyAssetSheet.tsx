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
    selectAccountsWithTokensToSellSectionCondensedListByTradingType,
} from '../../../selectors/commonSelectors';
import { MyAssetRow, TradeableAsset } from '../../../types/general';
import { SimpleSheetHeader } from '../SimpleSheetHeader';
import { MyAssetsDisabledListItem } from './MyAssetsDisabledListItem';

export type MyAssetSheetProps = {
    tradingType: TradingType;
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: MyAssetListItemProps['onPress'];
};

const keyExtractor = (asset: MyAssetRow, sectionData: Account) =>
    `${sectionData.key}_${asset.name}`;

const renderItem = (
    asset: MyAssetRow,
    { sectionData }: { sectionData: Account },
    onAssetSelect: MyAssetListItemProps['onPress'],
) =>
    asset.isEnabled ? (
        <MyAssetListItem asset={asset} account={sectionData} onPress={onAssetSelect} />
    ) : (
        <MyAssetsDisabledListItem count={asset.count} />
    );

export const MyAssetSheet = memo(
    ({ tradingType, isVisible, onClose, onAssetSelect }: MyAssetSheetProps) => {
        const onAssetSelectCallback = (asset: TradeableAsset, account: Account) => {
            onAssetSelect(asset, account);
            onClose();
        };

        const myAssets = useSelector((state: CombinedSelectorsRootState) =>
            selectAccountsWithTokensToSellSectionCondensedListByTradingType(state, tradingType),
        );

        const renderHandle = () => (
            <SimpleSheetHeader
                onClose={onClose}
                title={<Translation id="moduleTrading.myAssetSheet.title" />}
            />
        );

        return (
            <BottomSheetSectionList<MyAssetRow, Account>
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
