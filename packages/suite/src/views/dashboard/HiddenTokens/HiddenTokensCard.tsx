import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Table, Text } from '@trezor/components';

import { HiddenTokenRow } from './HiddenTokenRow';
import { UnhideAssetModal } from './UnhideAssetModal';
import { type AssetTotal } from '../AssetFirstTable/assetFirstTableSelectors';
import { ASSET_FIRST_CELL_PADDING } from '../AssetFirstTable/assetFirstTableUtils';

type HiddenTokensCardProps = {
    heading: ReactNode;
    assets: readonly AssetTotal[];
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    assets,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const [assetToUnhide, setAssetToUnhide] = useState<AssetTotal>();

    if (assets.length === 0) {
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
                <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                                <Translation id="TR_ASSET" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_BALANCE" />
                            </Table.Cell>
                            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.last} />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {assets.map(asset => (
                            <HiddenTokenRow
                                key={asset.assetKey}
                                asset={asset}
                                onClick={() => setAssetToUnhide(asset)}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Column>

            {assetToUnhide !== undefined && (
                <UnhideAssetModal
                    asset={assetToUnhide}
                    onCancel={() => setAssetToUnhide(undefined)}
                />
            )}
        </Card>
    );
};
