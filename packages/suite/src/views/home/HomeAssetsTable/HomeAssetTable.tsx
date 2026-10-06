import { Translation } from '@suite/intl';
import { selectShownWalletAssetKeys } from '@suite-common/assets';
import { Card, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetRow } from './HomeAssetRow';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableLayout';

export const HomeAssetTable = () => {
    const assetKeys = useSelector(selectShownWalletAssetKeys);

    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
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
                        <HomeAssetRow key={assetKey} assetKey={assetKey} />
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
};
