import { useCallback, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    type NftItem,
    selectHiddenNftCollectionKeys,
    selectNftCollectionItems,
    selectShownNftCollectionKeys,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Divider, Table, VirtualizedList } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetNftItemRow, HomeAssetNftMoreItemsRow } from './HomeAssetNftItemRow';
import { HomeAssetNftRow } from './HomeAssetNftRow';
import {
    NFT_COLLECTION_ROW_HEIGHT,
    NFT_COL_WIDTHS,
    NFT_ITEM_ROW_HEIGHT,
    NFT_LIST_MAX_HEIGHT,
    NFT_MORE_ROW_HEIGHT,
    NFT_SEPARATOR_HEIGHT,
} from './homeAssetNftLayout';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

// Spam collections can list thousands of items; past this many, one line says how many more.
const NFT_ITEMS_LIMIT = 50;

/**
 * The list is one flat run of rows, so the virtualizer sees fixed heights only: a collection, then
 * — while it is open — its items and, past the limit, one line for the rest.
 */
type NftListItem = { height: number; assetKey: WalletAssetKey } & (
    | { kind: 'collection' }
    | { kind: 'item'; item: NftItem; index: number }
    | { kind: 'more'; count: number }
);

const NO_ITEMS: readonly NftItem[] = [];

type HomeAssetNftTableProps = {
    isHidden: boolean;
};

export const HomeAssetNftTable = ({ isHidden }: HomeAssetNftTableProps) => {
    const assetKeys = useSelector(
        isHidden ? selectHiddenNftCollectionKeys : selectShownNftCollectionKeys,
    );
    const [openKeys, setOpenKeys] = useState<ReadonlySet<WalletAssetKey>>(() => new Set());

    // Only an open collection has its items built. `useSelector` compares with `shallowEqual` by
    // default, so this array stays the same while no open collection's items change.
    const openItems = useSelector(state =>
        assetKeys.map(assetKey =>
            openKeys.has(assetKey)
                ? (selectNftCollectionItems(state, assetKey, isHidden) ?? NO_ITEMS)
                : NO_ITEMS,
        ),
    );

    const { items, listHeight } = useMemo(() => {
        const rows = assetKeys.flatMap((assetKey, collectionIndex): NftListItem[] => {
            const collection: NftListItem = {
                kind: 'collection',
                assetKey,
                height: NFT_COLLECTION_ROW_HEIGHT,
            };
            const nftItems = openItems[collectionIndex] ?? NO_ITEMS;

            if (nftItems.length === 0) {
                return [collection];
            }

            const collectionRows: NftListItem[] = [
                collection,
                ...nftItems.slice(0, NFT_ITEMS_LIMIT).map((item, index): NftListItem => ({
                    kind: 'item',
                    assetKey,
                    item,
                    index,
                    height: NFT_ITEM_ROW_HEIGHT,
                })),
            ];
            const notListedCount = nftItems.length - NFT_ITEMS_LIMIT;

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

    // The same item can be held by two accounts of the wallet, so an item's id alone repeats.
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
                        <HomeAssetNftRow
                            assetKey={row.assetKey}
                            isHidden={isHidden}
                            isOpen={openKeys.has(row.assetKey)}
                            onToggle={toggleCollection}
                        />
                    );
                case 'item':
                    return <HomeAssetNftItemRow assetKey={row.assetKey} item={row.item} />;
                case 'more':
                    return <HomeAssetNftMoreItemsRow count={row.count} />;
                default:
                    return exhaustive(row);
            }
        },
        [isHidden, openKeys, toggleCollection],
    );

    // A row cannot sit in the virtualizer's positioned boxes on its own, so each gets a one-row table;
    // the percentage column widths keep them aligned with the header.
    const renderItem = useCallback(
        (row: NftListItem) => (
            <>
                {row.kind === 'collection' && (
                    <Divider margin={0} strokeWidth={NFT_SEPARATOR_HEIGHT} />
                )}
                <Table isRowHighlightedOnHover colWidths={NFT_COL_WIDTHS}>
                    <Table.Body>{renderRow(row)}</Table.Body>
                </Table>
            </>
        ),
        [renderRow],
    );

    return (
        <>
            <Table colWidths={NFT_COL_WIDTHS}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                            <Translation id="TR_HOME_ASSET_NFT_COLLECTION" />
                        </Table.Cell>
                        <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                            <Translation id="TR_NETWORK_TITLE" />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
            </Table>
            <VirtualizedList
                items={items}
                renderItem={renderItem}
                getItemKey={getItemKey}
                listHeight={listHeight}
                listMinHeight={0}
                resetScrollOnItemsChange={false}
            />
        </>
    );
};
