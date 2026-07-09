import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type TradingType } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { type BottomSheetFlashListHandleProps } from '@suite-native/atoms';
import { BottomSheetSectionList } from '@suite-native/trading-atoms';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionCondensedListByTradingType,
} from '@suite-native/trading-state';
import { type MyAssetRow, type TradeableAsset } from '@suite-native/trading-types';

import { MyAssetListEmptyComponent } from './MyAssetListEmptyComponent';
import { MyAssetListItem, type MyAssetListItemProps } from './MyAssetListItem';
import { MyAssetListSectionHeader } from './MyAssetListSectionHeader';
import { MyAssetSheetHeader } from './MyAssetSheetHeader';
import { MyAssetsDisabledListItem } from './MyAssetsDisabledListItem';
import { useMyAssetsFilteredData } from '../../../hooks/general/useMyAssetsFilteredData';

export type MyAssetSheetProps = {
    tradingType: TradingType;
    isVisible: boolean;
    onClose: (shouldHideKeyboard?: boolean) => void;
    onAssetSelect: MyAssetListItemProps['onPress'];
    testID?: string;
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
    ({ tradingType, isVisible, onClose, onAssetSelect, testID }: MyAssetSheetProps) => {
        const myAssets = useSelector((state: CombinedSelectorsRootState) =>
            selectAccountsWithTokensToSellSectionCondensedListByTradingType(state, tradingType),
        );

        const {
            filteredSections,
            setFilterValue,
            setFilterSymbol,
            availableNetworks,
            filterValue,
        } = useMyAssetsFilteredData(myAssets);

        const headerTestID = testID ? `${testID}/header` : undefined;

        const renderHandle = useCallback(
            ({ closeSheet }: BottomSheetFlashListHandleProps) => (
                <MyAssetSheetHeader
                    onClose={closeSheet}
                    onFilterChange={setFilterValue}
                    onSelectedNetworkFilter={setFilterSymbol}
                    availableNetworks={availableNetworks}
                    testID={headerTestID}
                />
            ),
            [setFilterValue, setFilterSymbol, availableNetworks, headerTestID],
        );

        return (
            <BottomSheetSectionList<MyAssetRow, Account>
                isVisible={isVisible}
                onClose={onClose}
                ListEmptyComponent={<MyAssetListEmptyComponent />}
                handleComponent={renderHandle}
                data={filteredSections}
                keyExtractor={keyExtractor}
                renderItem={(asset, config, { closeSheet }) =>
                    renderItem(asset, config, (selectedAsset: TradeableAsset, account: Account) => {
                        onAssetSelect(selectedAsset, account);
                        closeSheet();
                    })
                }
                renderSectionHeader={(_label, config) => {
                    const sectionIndex = filteredSections.findIndex(
                        section => section.sectionData.key === config.sectionData.key,
                    );

                    return (
                        <MyAssetListSectionHeader
                            account={config.sectionData}
                            isFirst={sectionIndex === 0}
                        />
                    );
                }}
                scrollResetKey={filterValue}
            />
        );
    },
);
