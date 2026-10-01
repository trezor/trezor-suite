import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { HiddenTokenRow } from './HiddenTokenRow';
import { HiddenTokensDustRow } from './HiddenTokensDustRow';
import { UnhideAssetModal } from './UnhideAssetModal';
import { type AssetAccounts } from '../HomeAssetTable/homeAssetTableSelectors';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetTable/homeAssetTableUtils';

type HiddenTokensCardProps = {
    heading: ReactNode;
    assets: readonly AssetAccounts[];
    dustRows: readonly AssetAccounts[];
    deviceState: StaticSessionId;
    'data-testid': string;
};

export const HiddenTokensCard = ({
    heading,
    assets,
    dustRows,
    deviceState,
    'data-testid': dataTestId,
}: HiddenTokensCardProps) => {
    const [assetToUnhide, setAssetToUnhide] = useState<AssetAccounts>();

    if (assets.length === 0 && dustRows.length === 0) {
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
                        <HiddenTokensDustRow
                            rows={dustRows}
                            deviceState={deviceState}
                            onUnhide={setAssetToUnhide}
                        />
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
