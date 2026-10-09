import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectHiddenWalletAssetKeys } from '@suite-common/assets';
import { type HiddenTokenReason, type WalletAssetKey } from '@suite-common/wallet-core';
import { Card, Column, Divider, Table, Text, VirtualizedList } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { HomeAssetRow } from 'src/views/home/HomeAssetsTable/HomeAssetRow';
import {
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_COL_WIDTHS,
    HOME_ASSET_ROW_HEIGHT,
} from 'src/views/home/HomeAssetsTable/homeAssetTableLayout';

import { UnhideAssetModal } from './UnhideAssetModal';

const LIST_MAX_ROW_COUNT = 9;

const SEPARATOR_HEIGHT = 1;
const ITEM_HEIGHT = HOME_ASSET_ROW_HEIGHT + SEPARATOR_HEIGHT;

type HiddenTokenItem = {
    assetKey: WalletAssetKey;
    height: number;
};

type HiddenTokensCardProps = {
    heading: ReactNode;
    reason: HiddenTokenReason;
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    reason,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const assetKeys = useSelector(state => selectHiddenWalletAssetKeys(state, reason));
    const [assetKeyToUnhide, setAssetKeyToUnhide] = useState<WalletAssetKey>();
    const items = useMemo(
        () => assetKeys.map(assetKey => ({ assetKey, height: ITEM_HEIGHT })),
        [assetKeys],
    );
    const getItemKey = useCallback((item: HiddenTokenItem) => item.assetKey, []);
    const renderItem = useCallback(
        ({ assetKey }: HiddenTokenItem) => (
            <>
                <Divider margin={0} strokeWidth={SEPARATOR_HEIGHT} />
                <Table isRowHighlightedOnHover colWidths={HOME_ASSET_COL_WIDTHS}>
                    <Table.Body>
                        <HomeAssetRow
                            assetKey={assetKey}
                            isHidden
                            onSelect={setAssetKeyToUnhide}
                            testIdPrefix="@hidden-tokens/item"
                        />
                    </Table.Body>
                </Table>
            </>
        ),
        [],
    );

    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid={dataTestId}>
            <Column alignItems="stretch">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: 16, left: 20 }}
                >
                    {heading}
                </Text>
                <Table isRowHighlightedOnHover colWidths={HOME_ASSET_COL_WIDTHS}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                                <Translation id="TR_ASSET" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_EXCHANGE_RATE" />
                            </Table.Cell>
                            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                                <Translation id="TR_BALANCE" />
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                </Table>
                <VirtualizedList
                    items={items}
                    renderItem={renderItem}
                    getItemKey={getItemKey}
                    listHeight={Math.min(items.length, LIST_MAX_ROW_COUNT) * ITEM_HEIGHT}
                    listMinHeight={0}
                    resetScrollOnItemsChange={false}
                />
            </Column>

            {assetKeyToUnhide !== undefined && (
                <UnhideAssetModal
                    assetKey={assetKeyToUnhide}
                    reason={reason}
                    onCancel={() => setAssetKeyToUnhide(undefined)}
                />
            )}
        </Card>
    );
};
