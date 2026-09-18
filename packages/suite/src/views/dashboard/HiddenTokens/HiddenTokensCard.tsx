import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Table, Text } from '@trezor/components';

import { HiddenTokenRow } from './HiddenTokenRow';
import { UnhideAssetModal } from './UnhideAssetModal';
import { type AssetAccounts } from '../HomeAssetTable/homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetTable/homeAssetTableUtils';

type HiddenTokensCardProps = {
    heading: ReactNode;
    assets: readonly AssetAccounts[];
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    assets,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const [assetToUnhide, setAssetToUnhide] = useState<AssetAccounts>();

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
                            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                                <Translation id="TR_ASSET" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_BALANCE" />
                            </Table.Cell>
                            <Table.Cell padding={HOME_ASSET_CELL_PADDING.last} />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {assets.map(assetAccounts => (
                            <HiddenTokenRow
                                key={assetAccounts[0].assetKey}
                                assetAccounts={assetAccounts}
                                onClick={() => setAssetToUnhide(assetAccounts)}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Column>

            {assetToUnhide !== undefined && (
                <UnhideAssetModal
                    assetAccounts={assetToUnhide}
                    onCancel={() => setAssetToUnhide(undefined)}
                />
            )}
        </Card>
    );
};
