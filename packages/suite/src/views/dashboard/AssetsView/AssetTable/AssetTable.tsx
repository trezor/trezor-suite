import { AssetFiatBalance } from '@suite-common/assets';
import { AssetRow } from './AssetRow';
import { AssetRowSkeleton } from './AssetRowSkeleton';
import { Network } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';

export interface AssetTableRowType {
    symbol: string;
    network: Network;
    assetBalance: BigNumber;
    assetFailed: boolean;
}

interface AssetTableProps {
    discoveryInProgress?: boolean;
    assetsData: AssetTableRowType[];
    assetsFiatBalances: AssetFiatBalance[];
}

export const AssetTable = ({
    discoveryInProgress,
    assetsData,
    assetsFiatBalances,
}: AssetTableProps) => (
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
                    failed={asset.assetFailed}
                    cryptoValue={asset.assetBalance.toFixed()}
                    isLastRow={i === assetsData.length - 1 && !discoveryInProgress}
                    assetsFiatBalances={assetsFiatBalances}
                />
            ))}
            {discoveryInProgress && <AssetRowSkeleton />}
        </Table.Body>
    </Table>
);
