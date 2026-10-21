import { useCallback, useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Column, Divider, Row, Text, VirtualizedList } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { NFT_ITEM_ICON_SIZE, NFT_ROW_PADDING, NftItemRow, NftMoreItemsRow } from './NftItemRow';
import { NftRow } from './NftRow';
import {
    type NftCollectionItems,
    type NftItem,
    type NftState,
    selectHiddenNftCollectionKeys,
    selectNftCollectionItems,
    selectShownNftCollectionKeys,
} from '../nftSelectors';

const NFT_ITEMS_LIMIT = 50;

const NFT_LIST_MIN_WIDTH = 480;

const NFT_SEPARATOR_HEIGHT = 1;

const NFT_COLLECTION_ROW_HEIGHT =
    NFT_ROW_PADDING.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    NFT_SEPARATOR_HEIGHT;

const NFT_ITEM_ROW_HEIGHT =
    NFT_ROW_PADDING.vertical * 2 +
    Math.max(NFT_ITEM_ICON_SIZE, typographyStylesBase['body-sm'].lineHeight);

const NFT_MORE_ROW_HEIGHT =
    NFT_ROW_PADDING.vertical * 2 + typographyStylesBase['body-sm'].lineHeight;

const NFT_LIST_MAX_HEIGHT = 9 * NFT_COLLECTION_ROW_HEIGHT;

type NftListItem = { height: number; assetKey: WalletAssetKey } & (
    | { kind: 'collection' }
    | { kind: 'item'; item: NftItem; index: number }
    | { kind: 'more'; count: number }
);

const NO_ITEMS: NftCollectionItems = { items: [], totalCount: 0 };

type NftListProps = {
    isHidden: boolean;
};

export const NftList = ({ isHidden }: NftListProps) => {
    const assetKeys = useSelector(
        isHidden ? selectHiddenNftCollectionKeys : selectShownNftCollectionKeys,
    );
    const [openKeys, setOpenKeys] = useState<ReadonlySet<WalletAssetKey>>(() => new Set());

    const openItems = useSelector(
        (state: NftState) =>
            assetKeys.map(assetKey =>
                openKeys.has(assetKey)
                    ? (selectNftCollectionItems(state, assetKey, isHidden, NFT_ITEMS_LIMIT) ??
                      NO_ITEMS)
                    : NO_ITEMS,
            ),
        shallowEqual,
    );

    const { items, listHeight } = useMemo(() => {
        const rows = assetKeys.flatMap((assetKey, collectionIndex): NftListItem[] => {
            const collection: NftListItem = {
                kind: 'collection',
                assetKey,
                height: NFT_COLLECTION_ROW_HEIGHT,
            };
            const { items: nftItems, totalCount } = openItems[collectionIndex] ?? NO_ITEMS;

            if (nftItems.length === 0) {
                return [collection];
            }

            const collectionRows: NftListItem[] = [
                collection,
                ...nftItems.map((item, index): NftListItem => ({
                    kind: 'item',
                    assetKey,
                    item,
                    index,
                    height: NFT_ITEM_ROW_HEIGHT,
                })),
            ];
            const notListedCount = totalCount - nftItems.length;

            if (notListedCount > 0) {
                collectionRows.push({
                    kind: 'more',
                    assetKey,
                    count: notListedCount,
                    height: NFT_MORE_ROW_HEIGHT,
                });
            }

            return collectionRows;
        });

        return {
            items: rows,
            listHeight: Math.min(
                rows.reduce((height, row) => height + row.height, 0),
                NFT_LIST_MAX_HEIGHT,
            ),
        };
    }, [assetKeys, openItems]);

    const toggleCollection = useCallback((assetKey: WalletAssetKey) => {
        setOpenKeys(open => {
            const next = new Set(open);

            if (!next.delete(assetKey)) {
                next.add(assetKey);
            }

            return next;
        });
    }, []);

    const getItemKey = useCallback((row: NftListItem) => {
        switch (row.kind) {
            case 'collection':
                return row.assetKey;
            case 'item':
                return `${row.assetKey}/${row.index}/${row.item.id}`;
            case 'more':
                return `${row.assetKey}/more`;
            default:
                return exhaustive(row);
        }
    }, []);

    const renderRow = useCallback(
        (row: NftListItem) => {
            switch (row.kind) {
                case 'collection':
                    return (
                        <NftRow
                            assetKey={row.assetKey}
                            isHidden={isHidden}
                            isOpen={openKeys.has(row.assetKey)}
                            onToggle={toggleCollection}
                        />
                    );
                case 'item':
                    return <NftItemRow assetKey={row.assetKey} item={row.item} />;
                case 'more':
                    return <NftMoreItemsRow count={row.count} />;
                default:
                    return exhaustive(row);
            }
        },
        [isHidden, openKeys, toggleCollection],
    );

    const renderItem = useCallback(
        (row: NftListItem) => (
            <>
                {row.kind === 'collection' && (
                    <Divider margin={0} strokeWidth={NFT_SEPARATOR_HEIGHT} />
                )}
                {renderRow(row)}
            </>
        ),
        [renderRow],
    );

    if (assetKeys.length === 0) {
        return (
            <Column alignItems="center" padding={{ vertical: 24, horizontal: 20 }}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation
                        id={isHidden ? 'TR_HIDDEN_NFT_EMPTY' : 'TR_NFT_EMPTY_CHECK_HIDDEN'}
                    />
                </Text>
            </Column>
        );
    }

    return (
        <Box overflow="auto">
            <Column minWidth={NFT_LIST_MIN_WIDTH}>
                <Row justifyContent="space-between" gap={16} padding={NFT_ROW_PADDING}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_HOME_ASSET_NFT_COLLECTION" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_NETWORK_TITLE" />
                    </Text>
                </Row>
                <VirtualizedList
                    items={items}
                    renderItem={renderItem}
                    getItemKey={getItemKey}
                    listHeight={listHeight}
                    listMinHeight={0}
                    resetScrollOnItemsChange={false}
                />
            </Column>
        </Box>
    );
};
