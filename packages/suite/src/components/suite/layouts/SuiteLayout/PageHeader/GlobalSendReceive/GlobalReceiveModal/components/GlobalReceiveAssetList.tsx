import { type RefObject, useCallback, useMemo } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
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

import { GLOBAL_RECEIVE_LIST_HEIGHT, GLOBAL_RECEIVE_LIST_MIN_HEIGHT } from '../constants';
import { type GlobalReceiveAssetListItem } from '../globalReceiveAssetUtils';

type GlobalReceiveListItem =
    | { type: 'group-label'; label: 'TR_MY_ASSETS' | 'TR_GLOBAL_RECEIVE_ALL_ASSETS' }
    | { type: 'group-space' }
    | ({ type: 'asset' } & GlobalReceiveAssetListItem);

type GlobalReceiveAssetListProps = {
    assetsWithBalance: GlobalReceiveAssetListItem[];
    allAssets: GlobalReceiveAssetListItem[];
    disabledMessage: TranslationKey | undefined;
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
    disabledMessage,
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
                case 'asset': {
                    const isDisabled = isAssetDisabled(item.asset);

                    return (
                        <Tooltip
                            content={
                                isDisabled && disabledMessage ? (
                                    <Translation id={disabledMessage} />
                                ) : undefined
                            }
                            placement="right"
                            cursor="not-allowed"
                            delayShow={TOOLTIP_DELAY_NORMAL}
                            width="100%"
                            offset={-200}
                        >
                            <AssetRowAsset
                                asset={item.asset}
                                balance={item.balance}
                                dataTestId={`@global-receive/asset/${item.asset.id}`}
                                isDisabled={isDisabled}
                                onClick={onAssetClick}
                            />
                        </Tooltip>
                    );
                }
                default:
                    return exhaustive(item);
            }
        },
        [disabledMessage, isAssetDisabled, onAssetClick],
    );

    return (
        <AssetsList
            items={listItems}
            renderItem={renderItem}
            getItemHeight={getItemHeight}
            height={GLOBAL_RECEIVE_LIST_HEIGHT}
            minHeight={GLOBAL_RECEIVE_LIST_MIN_HEIGHT}
            ref={listRef}
        />
    );
};
