import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectHiddenWalletAssetKeys } from '@suite-common/assets';
import { type HiddenTokenReason, type WalletAssetKey } from '@suite-common/wallet-core';
import { Card, Column, Table, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { HomeAssetRow } from 'src/views/home/HomeAssetsTable/HomeAssetRow';
import {
    HOME_ASSET_CELL_PADDING,
    HOME_ASSET_COL_WIDTHS,
} from 'src/views/home/HomeAssetsTable/homeAssetTableLayout';

import { UnhideAssetModal } from './UnhideAssetModal';

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
                    <Table.Body>
                        {assetKeys.map(assetKey => (
                            <HomeAssetRow
                                key={assetKey}
                                assetKey={assetKey}
                                isHidden
                                onSelect={setAssetKeyToUnhide}
                                testIdPrefix="@hidden-tokens/item"
                            />
                        ))}
                    </Table.Body>
                </Table>
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
