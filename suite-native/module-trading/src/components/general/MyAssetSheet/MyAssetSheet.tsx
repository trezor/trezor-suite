import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type TradingType } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { BottomSheetSectionList } from '@suite-native/trading-atoms';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionCondensedListByTradingType,
} from '@suite-native/trading-state';
import { type MyAssetRow, type TradeableAsset } from '@suite-native/trading-types';

import { MyAssetListEmptyComponent } from './MyAssetListEmptyComponent';
import { MyAssetListItem, type MyAssetListItemProps } from './MyAssetListItem';
import { MyAssetListSectionHeader } from './MyAssetListSectionHeader';
import { SimpleSheetHeader } from '../SimpleSheetHeader';
import { MyAssetsDisabledListItem } from './MyAssetsDisabledListItem';

export type MyAssetSheetProps = {
    tradingType: TradingType;
    isVisible: boolean;
    onClose: (shouldHideKeyboard?: boolean) => void;
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
            onClose(false);
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
