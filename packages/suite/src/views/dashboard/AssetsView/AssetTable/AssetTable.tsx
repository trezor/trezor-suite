import { AssetRow, AssetTableRowProps } from './AssetRow';
import { AssetRowSkeleton } from './AssetRowSkeleton';

import { Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';

interface AssetTableProps {
    discoveryInProgress?: boolean;
    assetsData: AssetTableRowProps[];
    // assetsFiatBalances: AssetFiatBalance[];
}

export const AssetTable = ({
    discoveryInProgress,
    assetsData,
    // assetsFiatBalances,
}: AssetTableProps) => {
    return (
        <Table isRowHighlightedOnHover margin={{ top: spacings.md, bottom: spacings.md }}>
            <Table.Header>
                <Table.Row>
                    <Table.Cell colSpan={3}>
                        <Translation id="TR_ASSETS" />
                    </Table.Cell>
                    <Table.Cell>
                        <Translation id="TR_VALUES" />
                    </Table.Cell>
                    <Table.Cell>
                        <Translation id="TR_EXCHANGE_RATE" />
                    </Table.Cell>
                    <Table.Cell colSpan={3}>
                        <Translation id="TR_7D_CHANGE" />
                    </Table.Cell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {assetsData.map((asset, i) => (
                    <AssetRow
                        key={asset.symbol}
                        network={asset.network}
                        failed={asset.failed}
                        assetCryptoBalance={asset.assetCryptoBalance}
                        isLastRow={i === assetsData.length - 1 && !discoveryInProgress}
                        // assetsFiatBalances={assetsFiatBalances}
                        assetTokens={asset.assetTokens}
                    />
                ))}
                {discoveryInProgress && <AssetRowSkeleton />}
            </Table.Body>
        </Table>
    );
};
