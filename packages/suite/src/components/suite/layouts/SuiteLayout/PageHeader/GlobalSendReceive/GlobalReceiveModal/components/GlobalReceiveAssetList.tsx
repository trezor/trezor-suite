import { type RefObject, useCallback, useMemo } from 'react';

import { type TradingAssetOption } from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

import {
    AssetGroupLabel,
    AssetGroupSpace,
    AssetRowAsset,
    AssetsList,
} from 'src/components/suite/asset-picker/components';
import {
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
} from 'src/components/suite/asset-picker/constants';

import { type GlobalReceiveAssetListItem } from '../globalReceiveAssetUtils';

type GlobalReceiveListItem =
    | { type: 'group-label'; label: 'TR_MY_ASSETS' | 'TR_GLOBAL_RECEIVE_ALL_ASSETS' }
    | { type: 'group-space' }
    | ({ type: 'asset' } & GlobalReceiveAssetListItem);

type GlobalReceiveAssetListProps = {
    assetsWithBalance: GlobalReceiveAssetListItem[];
    allAssets: GlobalReceiveAssetListItem[];
    listRef: RefObject<HTMLDivElement | null>;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    onAssetClick: (asset: TradingAssetOption) => void;
};

const getItemHeight = (item: GlobalReceiveListItem): number => {
    switch (item.type) {
        case 'group-label':
            return ASSET_ROW_GROUP_LABEL_HEIGHT;
        case 'group-space':
            return ASSET_ROW_HEIGHTS_BY_SIZE.lg;
        case 'asset':
            return ASSET_ROW_HEIGHT;
        default:
            return exhaustive(item);
    }
};

export const GlobalReceiveAssetList = ({
    assetsWithBalance,
    allAssets,
    listRef,
    isAssetDisabled,
    onAssetClick,
}: GlobalReceiveAssetListProps) => {
    const listItems = useMemo<GlobalReceiveListItem[]>(() => {
        if (assetsWithBalance.length === 0) {
            return allAssets.map(item => ({ type: 'asset', ...item }));
        }

        return [
            { type: 'group-label', label: 'TR_MY_ASSETS' },
            ...assetsWithBalance.map(item => ({ type: 'asset' as const, ...item })),
            ...(allAssets.length > 0
                ? [
                      { type: 'group-space' as const },
                      {
                          type: 'group-label' as const,
                          label: 'TR_GLOBAL_RECEIVE_ALL_ASSETS' as const,
                      },
                      ...allAssets.map(item => ({ type: 'asset' as const, ...item })),
                  ]
                : []),
        ];
    }, [allAssets, assetsWithBalance]);

    const renderItem = useCallback(
        (item: GlobalReceiveListItem) => {
            switch (item.type) {
                case 'group-label':
                    return <AssetGroupLabel label={item.label} priority="secondary" />;
                case 'group-space':
                    return <AssetGroupSpace size="lg" />;
                case 'asset':
                    return (
                        <AssetRowAsset
                            asset={item.asset}
                            balance={item.balance}
                            dataTestId={`@global-receive/asset/${item.asset.id}`}
                            isDisabled={isAssetDisabled(item.asset)}
                            onClick={onAssetClick}
                        />
                    );
                default:
                    return exhaustive(item);
            }
        },
        [isAssetDisabled, onAssetClick],
    );

    return (
        <AssetsList
            items={listItems}
            renderItem={renderItem}
            getItemHeight={getItemHeight}
            height={430}
            minHeight={260}
            ref={listRef}
        />
    );
};
